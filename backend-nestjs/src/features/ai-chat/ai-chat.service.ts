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
  AiChatOwner,
  AiMessageRole,
  ChatbotConfig,
  ChatCompletionMessage,
  ProductContextItem,
} from './types/ai-chat.types';
import {
  DEFAULT_SYSTEM_PROMPT,
  buildProductContext,
  callChatCompletion,
  extractKeywords,
  parsePriceHint,
} from './utils/ai-chat.util';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { Product } from '../product/entities/product.entity';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

const FALLBACK_REPLY =
  'Xin lỗi, trợ lý AI hiện tạm thời không khả dụng. Bạn vui lòng thử lại sau ít phút, hoặc liên hệ trực tiếp với người bán để được hỗ trợ nhanh nhất nhé.';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
    private readonly conversationRepository: AiConversationRepository,
    private readonly messageRepository: AiMessageRepository,
    private readonly settingRepository: AiSettingRepository,
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

    // 1. Retrieval — keyword-based (the product repo matches `search` as one
    //    LIKE, so a whole sentence never matches). No LLM call.
    const products = await this.retrieveProducts(message);
    const context = products.map((p) => this.toContextItem(p));

    // 2. History (older turns first) → LLM messages.
    const history = await this.messageRepository.findRecent(
      conversation.id,
      AI_HISTORY_LIMIT,
    );
    const systemPrompt =
      (setting.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT) +
      buildProductContext(context);

    const llmMessages: ChatCompletionMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === AiMessageRole.Assistant ? ('assistant' as const) : ('user' as const),
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // 3. Generation — the single LLM call; fall back gracefully on failure.
    let reply: string;
    try {
      reply = await callChatCompletion(llmMessages, config);
    } catch (err) {
      this.logger.error(
        `AI chat generation failed (conversation ${conversation.id}): ${(err as Error).message}`,
      );
      reply = FALLBACK_REPLY;
    }

    // 4. Persist both turns (assistant snapshots suggested product ids).
    const productIds = products.map((p) => p.id);
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
    });
    await this.conversationRepository.touch(conversation.id);

    return {
      conversation_id: conversation.id,
      reply,
      products: products as unknown as ChatResponseDto['products'],
    };
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

  async updateSettings(dto: UpdateAiSettingsDto): Promise<AiSettingsResponseDto> {
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
    const queries = keywords.length > 0 ? keywords : [message.trim()];

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
    return {
      apiKey,
      baseUrl: this.configService.get<string>('chatbot.baseUrl')!,
      chatModel: this.configService.get<string>('chatbot.chatModel')!,
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
      const existing = await this.conversationRepository.findById(conversationId);
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
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        products: cards as unknown as AiMessageResponseDto['products'],
        created_at: m.created_at,
      };
    });
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
