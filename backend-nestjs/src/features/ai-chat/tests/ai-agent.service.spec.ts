import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiChatService } from '../ai-chat.service';
import { AiConversationRepository } from '../repositories/ai-conversation.repository';
import { AiMessageRepository } from '../repositories/ai-message.repository';
import { AiSettingRepository } from '../repositories/ai-setting.repository';
import { ProductService } from '../../product/product.service';
import { ToolDispatcher } from '../tools/tool-dispatcher';

const CONFIG_MAP: Record<string, string> = {
  'chatbot.apiKey': 'test-key',
  'chatbot.baseUrl': 'https://openrouter.ai/api/v1',
  'chatbot.chatModel': 'x-ai/grok-4-fast:free',
  'chatbot.agentModel': 'x-ai/grok-4-fast:free',
};

/** Queue LLM responses consumed one-per-fetch (tool round, then final text). */
function mockFetchSequence(responses: any[]) {
  const fn = jest.fn();
  for (const r of responses) {
    fn.mockResolvedValueOnce({ ok: true, json: async () => r });
  }
  global.fetch = fn;
  return fn;
}

const toolCallResponse = (name: string, args: object) => ({
  choices: [
    {
      message: {
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name, arguments: JSON.stringify(args) },
          },
        ],
      },
    },
  ],
});

const textResponse = (content: string) => ({
  choices: [{ message: { content } }],
});

describe('AiChatService — agent tool loop', () => {
  let service: AiChatService;
  let messageRepo: jest.Mocked<AiMessageRepository>;
  let dispatcher: jest.Mocked<ToolDispatcher>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => CONFIG_MAP[key]) },
        },
        {
          provide: ProductService,
          useValue: {
            findActiveProducts: jest
              .fn()
              .mockResolvedValue({ data: [], meta: {} }),
            findActiveByIds: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AiConversationRepository,
          useValue: {
            findById: jest.fn(),
            create: jest
              .fn()
              .mockResolvedValue({ id: 10, user_id: 5, session_id: null }),
            touch: jest.fn(),
          },
        },
        {
          provide: AiMessageRepository,
          useValue: {
            create: jest.fn(),
            findRecent: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AiSettingRepository,
          useValue: {
            get: jest.fn().mockResolvedValue({
              chatbox_enabled: true,
              system_prompt: null,
            }),
          },
        },
        {
          provide: ToolDispatcher,
          useValue: { run: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AiChatService);
    messageRepo = module.get(AiMessageRepository);
    dispatcher = module.get(ToolDispatcher);
  });

  afterEach(() => jest.restoreAllMocks());

  const customer = { userId: 5, sessionId: null } as const;

  it('dispatches a tool call, feeds the result back, and returns the final reply + action', async () => {
    mockFetchSequence([
      toolCallResponse('add_to_cart', { product_variant_id: 11, quantity: 2 }),
      textResponse('Đã thêm 2 áo vào giỏ của bạn.'),
    ]);
    dispatcher.run.mockResolvedValue({
      content: { ok: true },
      action: { type: 'cart_updated', data: { cart_id: 9, item_count: 1 } },
    });

    const res = await service.chat({ message: 'thêm 2 áo vào giỏ' }, customer);

    expect(dispatcher.run).toHaveBeenCalledWith(
      'add_to_cart',
      { product_variant_id: 11, quantity: 2 },
      customer,
    );
    expect(res.reply).toBe('Đã thêm 2 áo vào giỏ của bạn.');
    expect(res.actions).toEqual([
      { type: 'cart_updated', data: { cart_id: 9, item_count: 1 } },
    ]);
    // Persists user + assistant turns; assistant snapshots the actions JSON.
    expect(messageRepo.create).toHaveBeenCalledTimes(2);
    expect(messageRepo.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        role: 'assistant',
        actions: expect.stringContaining('cart_updated'),
      }),
    );
  });

  it('degrades to a plain reply when the model returns no tool calls (RAG fallback)', async () => {
    mockFetchSequence([textResponse('Chào bạn, mình có thể giúp gì?')]);

    const res = await service.chat({ message: 'xin chào' }, customer);

    expect(dispatcher.run).not.toHaveBeenCalled();
    expect(res.reply).toBe('Chào bạn, mình có thể giúp gì?');
    expect(res.actions).toBeUndefined();
  });
});
