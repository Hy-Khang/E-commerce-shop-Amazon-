import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiConversationRepository } from './repositories/ai-conversation.repository';
import { AiMessageRepository } from './repositories/ai-message.repository';
import { AiSettingRepository } from './repositories/ai-setting.repository';
import { ProductService } from '../product/product.service';
import { ProductQueryDto } from '../product/dto/product-query.dto';
import { CartService } from '../cart/cart.service';
import { ICartOwner } from '../cart/types/cart.types';
import { ChatDto } from './dto/chat.dto';
import {
  AiConfigResponseDto,
  AiConversationDetailResponseDto,
  AiMessageResponseDto,
  ChatResponseDto,
} from './dto/chat-response.dto';
import {
  AiSettingsResponseDto,
  UpdateAiSettingsDto,
} from './dto/ai-settings.dto';
import {
  AI_HISTORY_LIMIT,
  AI_RETRIEVAL_LIMIT,
  AgentAction,
  AiChatOwner,
  AiMessageRole,
  ChatbotConfig,
  ChatCompletionMessage,
  LlmResult,
  MAX_TOOL_ROUNDS,
  ProductContextItem,
  ToolDispatchResult,
} from './types/ai-chat.types';
import {
  AGENT_SYSTEM_PROMPT_SUFFIX,
  DEFAULT_SYSTEM_PROMPT,
  buildProductContext,
  callChatCompletion,
  extractKeywords,
  parsePriceHint,
} from './utils/ai-chat.util';
import { AGENT_TOOLS } from './tools/agent-tools';
import { ToolDispatcher } from './tools/tool-dispatcher';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { Product } from '../product/entities/product.entity';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

const FALLBACK_REPLY =
  'Xin lỗi, trợ lý AI hiện tạm thời không khả dụng. Bạn vui lòng thử lại sau ít phút, hoặc liên hệ trực tiếp với người bán để được hỗ trợ nhanh nhất nhé.';

/** Target size of the suggestion carousel — when the turn's own picks fall short
 *  (e.g. the only match was the item just added to cart, now excluded), backfill
 *  with other products from the same category up to this many. */
const SUGGESTION_FILL_TARGET = 6;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly conversationRepository: AiConversationRepository,
    private readonly messageRepository: AiMessageRepository,
    private readonly settingRepository: AiSettingRepository,
    private readonly toolDispatcher: ToolDispatcher,
  ) {}

  // ─── Public: config gate ───

  async getConfig(): Promise<AiConfigResponseDto> {
    const setting = await this.settingRepository.get();
    return { enabled: setting.chatbox_enabled };
  }

  // ─── Public: chat (RAG, single LLM call) ───

  async chat(dto: ChatDto, owner: AiChatOwner): Promise<ChatResponseDto> {
    const message = dto.message?.trim();
    if (!message) {
      throw new BadRequestException({
        code: 'CHATBOT_002',
        message: 'Message is empty or exceeds the maximum length',
      });
    }

    const setting = await this.settingRepository.get();
    if (!setting.chatbox_enabled) {
      throw new BadRequestException({
        code: 'CHATBOT_005',
        message: 'AI chatbox is currently disabled',
      });
    }

    const config = this.resolveConfig();

    const conversation = await this.resolveConversation(
      dto.conversation_id,
      owner,
      message,
    );

    // 1. Retrieval — keyword-based seed context (the product repo matches
    //    `search` as one LIKE, so a whole sentence never matches). No LLM call.
    //    This primes the first round so the model often needn't call
    //    search_products for a simple recommendation.
    const seedProducts = await this.retrieveProducts(message);
    const context = seedProducts.map((p) => this.toContextItem(p));

    // 2. History (older turns first) → LLM messages.
    const history = await this.messageRepository.findRecent(
      conversation.id,
      AI_HISTORY_LIMIT,
    );
    const systemPrompt =
      (setting.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT) +
      buildProductContext(context) +
      AGENT_SYSTEM_PROMPT_SUFFIX;

    const llmMessages: ChatCompletionMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role:
          m.role === AiMessageRole.Assistant
            ? ('assistant' as const)
            : ('user' as const),
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // 3. Agent loop — multi-step tool-calling, bounded. Falls back gracefully
    //    (a model that ignores tools just returns a plain reply).
    const {
      reply,
      actions,
      productIds: toolProductIds,
    } = await this.runAgentLoop(llmMessages, config, owner);

    // 4. Choose which products to show as suggestions: the agent's own
    //    search_products results first (what it actually recommended), then the
    //    keyword seed — but only seed products in the dominant category, so a
    //    fashion chat never shows a stray phone.
    const products = await this.selectSuggestedProducts(
      seedProducts,
      toolProductIds,
      owner,
    );
    const productIds = products.map((p) => p.id);

    // 5. Persist both turns (assistant snapshots suggested product ids + actions).
    await this.messageRepository.create({
      conversation_id: conversation.id,
      role: AiMessageRole.User,
      content: message,
    });
    await this.messageRepository.create({
      conversation_id: conversation.id,
      role: AiMessageRole.Assistant,
      content: reply,
      product_ids: productIds.length ? JSON.stringify(productIds) : null,
      actions: actions.length ? JSON.stringify(actions) : null,
    });
    await this.conversationRepository.touch(conversation.id);

    return {
      conversation_id: conversation.id,
      reply,
      products: products as unknown as ChatResponseDto['products'],
      ...(actions.length && { actions: actions }),
    };
  }

  /**
   * Bounded multi-step tool-calling loop. Each round is one LLM call: if the
   * model returns `tool_calls`, we execute them via `ToolDispatcher` (using the
   * request-derived `owner`, never trusting tool args for identity), feed the
   * results back, and loop. When the model returns plain content we stop.
   * A provider/rate-limit error breaks the loop while keeping any actions
   * already performed. Identical tool calls are de-duplicated to avoid double
   * side-effects (e.g. adding the same item twice).
   */
  private async runAgentLoop(
    llmMessages: ChatCompletionMessage[],
    config: ChatbotConfig,
    owner: AiChatOwner,
  ): Promise<{ reply: string; actions: AgentAction[]; productIds: number[] }> {
    const actions: AgentAction[] = [];
    const productIds: number[] = [];
    const seenCalls = new Set<string>();
    let reply = '';

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let result: LlmResult;
      try {
        result = await callChatCompletion(llmMessages, config, {
          tools: AGENT_TOOLS,
          model: config.agentModel,
        });
      } catch (err) {
        this.logger.error(
          `Agent LLM call failed (round ${round}): ${(err as Error).message}`,
        );
        return { reply: reply || FALLBACK_REPLY, actions, productIds };
      }

      if (!result.tool_calls?.length) {
        return { reply: result.content ?? '', actions, productIds };
      }

      // Echo the assistant's tool-call turn before appending tool results.
      llmMessages.push({
        role: 'assistant',
        content: result.content ?? '',
        tool_calls: result.tool_calls,
      });

      for (const call of result.tool_calls) {
        const dedupeKey = `${call.function.name}:${call.function.arguments}`;
        let dispatch: ToolDispatchResult;
        if (seenCalls.has(dedupeKey)) {
          dispatch = {
            content: {
              skipped: true,
              note: 'Tool call trùng lặp đã bị bỏ qua.',
            },
          };
        } else {
          seenCalls.add(dedupeKey);
          dispatch = await this.toolDispatcher.run(
            call.function.name,
            this.parseToolArgs(call.function.arguments),
            owner,
          );
          if (dispatch.action) actions.push(dispatch.action);
          if (dispatch.productIds?.length)
            productIds.push(...dispatch.productIds);
        }
        llmMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(dispatch.content),
        });
      }
    }

    // Rounds exhausted with tools still pending — force one final text answer.
    try {
      const final = await callChatCompletion(llmMessages, config, {
        model: config.agentModel,
      });
      reply = final.content ?? '';
    } catch {
      reply = '';
    }
    return {
      reply:
        reply ||
        'Mình đã thực hiện xong các thao tác bạn yêu cầu. Bạn cần hỗ trợ gì thêm không?',
      actions,
      productIds,
    };
  }

  private parseToolArgs(raw: string): Record<string, any> {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Pick the suggestion cards for an assistant turn. The agent's own
   * `search_products` results (the products it actually engaged with) come first
   * and are ALWAYS kept. The keyword seed is appended only for products in the
   * **dominant category** (the category most tool/seed products belong to), so a
   * noisy seed can't leak an unrelated item (e.g. a phone into an áo-thun chat).
   * When neither source has a clear category, the seed passes through as-is.
   *
   * Products already in the caller's cart are dropped — after an add-to-cart the
   * item just added is redundant to re-suggest. If that leaves the carousel thin,
   * it is backfilled with **other products from the same category** ("similar"),
   * so the shopper keeps discovering instead of seeing an empty/echo carousel.
   */
  private async selectSuggestedProducts(
    seed: Product[],
    toolProductIds: number[],
    owner: AiChatOwner,
  ): Promise<Product[]> {
    const toolProducts = toolProductIds.length
      ? await this.productService.findActiveByIds([...new Set(toolProductIds)])
      : [];

    // Dominant category: from the agent's picks first, else from the seed.
    const dominantCategoryId =
      this.dominantCategoryId(toolProducts) ?? this.dominantCategoryId(seed);

    // Never re-suggest what's already in the cart (esp. the just-added item).
    // Candidates carry eager variants, so match by variant id — the cart DTO
    // exposes variant ids, not product ids.
    const cartVariantIds = await this.cartVariantIds(owner);
    const inCart = (p: Product): boolean =>
      (p.variants ?? []).some((v) => cartVariantIds.has(v.id));

    const seen = new Set<number>();
    const result: Product[] = [];
    // Tracks whether a candidate was dropped *because* it's in the cart — the
    // "echo" case that warrants a same-category backfill. A plain discovery turn
    // (no cart overlap) is left exactly as before, so we never pad it with
    // off-constraint products (e.g. ignoring the user's price filter).
    let droppedInCart = false;
    const push = (p: Product): void => {
      if (seen.has(p.id)) return;
      if (inCart(p)) {
        droppedInCart = true;
        return;
      }
      seen.add(p.id);
      result.push(p);
    };

    for (const p of toolProducts) push(p);
    for (const p of seed) {
      // Coherence: drop seed products outside the dominant category.
      if (
        dominantCategoryId != null &&
        this.categoryId(p) !== dominantCategoryId
      )
        continue;
      push(p);
    }

    // Backfill "similar" products from the same category only when the cart
    // swallowed a candidate (typically the item just added) and that left the
    // carousel thin — so the shopper sees alternatives, not an echo/empty row.
    if (
      droppedInCart &&
      dominantCategoryId != null &&
      result.length < SUGGESTION_FILL_TARGET
    ) {
      const more = await this.productService.findActiveProducts({
        category_id: dominantCategoryId,
        page: 1,
        limit: SUGGESTION_FILL_TARGET * 2,
      } as ProductQueryDto);
      for (const p of more.data) push(p);
    }

    return result.slice(0, 12);
  }

  /**
   * Product-variant ids currently in the caller's cart, used to keep suggestions
   * from echoing what's already added. Best-effort — a cart read failure never
   * breaks the reply (returns an empty set).
   */
  private async cartVariantIds(owner: AiChatOwner): Promise<Set<number>> {
    try {
      const cart = await this.cartService.getCart(this.toCartOwner(owner));
      return new Set((cart.items ?? []).map((it) => it.product_variant_id));
    } catch {
      return new Set();
    }
  }

  private toCartOwner(owner: AiChatOwner): ICartOwner {
    return owner.userId != null
      ? { userId: owner.userId }
      : { sessionId: owner.sessionId };
  }

  private categoryId(p: Product): number | null {
    return (
      p.category?.id ?? (p as { category_id?: number }).category_id ?? null
    );
  }

  /** Most frequent category id among products (ties → first seen); null if none. */
  private dominantCategoryId(products: Product[]): number | null {
    const counts = new Map<number, number>();
    let best: number | null = null;
    let bestCount = 0;
    for (const p of products) {
      const cid = this.categoryId(p);
      if (cid == null) continue;
      const next = (counts.get(cid) ?? 0) + 1;
      counts.set(cid, next);
      if (next > bestCount) {
        bestCount = next;
        best = cid;
      }
    }
    return best;
  }

  // ─── Public: resume a conversation ───

  async getConversation(
    id: number,
    owner: AiChatOwner,
  ): Promise<AiConversationDetailResponseDto> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException({
        code: 'CHATBOT_001',
        message: 'Conversation not found',
      });
    }
    this.assertOwner(conversation, owner);

    const messages = await this.messageRepository.findByConversation(id);
    return {
      conversation_id: id,
      messages: await this.hydrateMessages(messages),
    };
  }

  // ─── Admin (Module 13) ───

  async adminListConversations(
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<AiConversation>> {
    return this.conversationRepository.findAllPaginated(page, limit);
  }

  async adminGetConversation(
    id: number,
  ): Promise<AiConversationDetailResponseDto> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException({
        code: 'CHATBOT_001',
        message: 'Conversation not found',
      });
    }
    const messages = await this.messageRepository.findByConversation(id);
    return {
      conversation_id: id,
      messages: await this.hydrateMessages(messages),
    };
  }

  async getSettings(): Promise<AiSettingsResponseDto> {
    const s = await this.settingRepository.get();
    return {
      chatbox_enabled: s.chatbox_enabled,
      system_prompt: s.system_prompt,
      updated_at: s.updated_at,
    };
  }

  async updateSettings(
    dto: UpdateAiSettingsDto,
  ): Promise<AiSettingsResponseDto> {
    const s = await this.settingRepository.update({
      ...(dto.chatbox_enabled !== undefined && {
        chatbox_enabled: dto.chatbox_enabled,
      }),
      ...(dto.system_prompt !== undefined && {
        system_prompt: dto.system_prompt,
      }),
    });
    return {
      chatbox_enabled: s.chatbox_enabled,
      system_prompt: s.system_prompt,
      updated_at: s.updated_at,
    };
  }

  // ─── Helpers ───

  /**
   * RAG retrieval: reduce the message to keywords, search the catalog per
   * keyword (respecting any price hint), and merge unique products preserving
   * relevance order. Falls back to the raw message when no keyword survives.
   */
  private async retrieveProducts(message: string): Promise<Product[]> {
    const priceHint = parsePriceHint(message);
    const keywords = extractKeywords(message);
    // No product keyword survived — a greeting, thanks, or a follow-up like
    // "size M đi" / "màu đen nha". The old whole-sentence fallback LIKE-matched
    // random items (a phone leaking into a t-shirt chat), so seed nothing: the
    // model answers from history, or is told to call search_products.
    if (keywords.length === 0) return [];
    const queries = keywords;

    const lists = await Promise.all(
      queries.map((search) =>
        this.productService
          .findActiveProducts({
            page: 1,
            limit: AI_RETRIEVAL_LIMIT,
            search,
            ...priceHint,
          } as any)
          .then((r) => r.data)
          .catch(() => [] as Product[]),
      ),
    );

    const seen = new Set<number>();
    const merged: Product[] = [];
    for (const list of lists) {
      for (const p of list) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        merged.push(p);
      }
    }
    return merged.slice(0, AI_RETRIEVAL_LIMIT);
  }

  private resolveConfig(): ChatbotConfig {
    const apiKey = this.configService.get<string>('chatbot.apiKey');
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: 'CHATBOT_004',
        message: 'AI chatbox is not configured',
      });
    }
    const chatModel = this.configService.get<string>('chatbot.chatModel')!;
    return {
      apiKey,
      baseUrl: this.configService.get<string>('chatbot.baseUrl')!,
      chatModel,
      agentModel:
        this.configService.get<string>('chatbot.agentModel') || chatModel,
    };
  }

  /**
   * Resolve the conversation for a `chat()` turn. **Self-healing:** a supplied
   * id that is missing (DB reseeded / another device) or not owned by the caller
   * (e.g. a guest thread carried into a logged-in session) is treated as stale —
   * a fresh conversation is started instead of throwing, so the persisted widget
   * never gets stuck resending a dead id. Explicit resume (`getConversation`)
   * stays strict (404/403).
   */
  private async resolveConversation(
    conversationId: number | undefined,
    owner: AiChatOwner,
    firstMessage: string,
  ): Promise<AiConversation> {
    if (conversationId) {
      const existing =
        await this.conversationRepository.findById(conversationId);
      if (existing && this.isOwner(existing, owner)) {
        return existing;
      }
      this.logger.warn(
        `Stale/non-owned conversation ${conversationId} — starting a fresh thread`,
      );
    }

    return this.conversationRepository.create({
      user_id: owner.userId,
      session_id: owner.sessionId,
      title: firstMessage.slice(0, 255),
    });
  }

  private isOwner(conversation: AiConversation, owner: AiChatOwner): boolean {
    return owner.userId != null
      ? conversation.user_id === owner.userId
      : conversation.session_id != null &&
          conversation.session_id === owner.sessionId;
  }

  private assertOwner(conversation: AiConversation, owner: AiChatOwner): void {
    if (!this.isOwner(conversation, owner)) {
      throw new ForbiddenException({
        code: 'CHATBOT_003',
        message: 'You do not own this conversation',
      });
    }
  }

  /** Compact projection for the RAG context — cheap on tokens, null-safe. */
  private toContextItem(p: Product): ProductContextItem {
    const prices = (p.variants ?? []).map((v) =>
      Number(v.sale_price ?? v.price),
    );
    const priceFrom = prices.length ? Math.min(...prices) : 0;
    const priceTo = prices.length ? Math.max(...prices) : 0;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price_from: priceFrom,
      price_to: priceTo,
      category: p.category?.name ?? null,
      shop: p.shop?.name ?? null,
    };
  }

  /** Attach hydrated product cards to each message from its snapshot ids. */
  private async hydrateMessages(
    messages: AiMessage[],
  ): Promise<AiMessageResponseDto[]> {
    const allIds = new Set<number>();
    for (const m of messages) {
      for (const id of this.parseIds(m.product_ids)) allIds.add(id);
    }
    const products = allIds.size
      ? await this.productService.findActiveByIds([...allIds])
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));

    return messages.map((m) => {
      const ids = this.parseIds(m.product_ids);
      const cards = ids
        .map((id) => byId.get(id))
        .filter((p): p is Product => p != null);
      const actions = this.parseActions(m.actions);
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        products: cards,
        ...(actions.length && {
          actions: actions,
        }),
        created_at: m.created_at,
      };
    });
  }

  /** Parse the persisted agent-action JSON snapshot (assistant turns). */
  private parseActions(raw: string | null): AgentAction[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as AgentAction[]) : [];
    } catch {
      return [];
    }
  }

  private parseIds(raw: string | null): number[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((n): n is number => Number.isInteger(n))
        : [];
    } catch {
      return [];
    }
  }
}
