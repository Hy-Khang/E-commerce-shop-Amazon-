import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AiChatService } from '../ai-chat.service';
import { AiConversationRepository } from '../repositories/ai-conversation.repository';
import { AiMessageRepository } from '../repositories/ai-message.repository';
import { AiSettingRepository } from '../repositories/ai-setting.repository';
import { ProductService } from '../../product/product.service';

const CONFIG_MAP: Record<string, string> = {
  'chatbot.apiKey': 'test-key',
  'chatbot.baseUrl': 'https://openrouter.ai/api/v1',
  'chatbot.chatModel': 'x-ai/grok-4-fast:free',
};

function mockFetchReply(content: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  }) as unknown as typeof fetch;
}

describe('AiChatService', () => {
  let service: AiChatService;
  let conversationRepo: jest.Mocked<AiConversationRepository>;
  let messageRepo: jest.Mocked<AiMessageRepository>;
  let settingRepo: jest.Mocked<AiSettingRepository>;
  let productService: jest.Mocked<ProductService>;
  let apiKey: string;

  beforeEach(async () => {
    apiKey = 'test-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'chatbot.apiKey' ? apiKey : CONFIG_MAP[key],
            ),
          },
        },
        {
          provide: ProductService,
          useValue: {
            findActiveProducts: jest.fn().mockResolvedValue({
              data: [
                { id: 1, name: 'Áo thun đen', slug: 'ao-thun-den', variants: [{ price: 200000, sale_price: null }] },
              ],
              meta: { page: 1, limit: 6, total: 1, totalPages: 1 },
            }),
            findActiveByIds: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AiConversationRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn().mockResolvedValue({ id: 10, user_id: null, session_id: 's1' }),
            touch: jest.fn(),
            findAllPaginated: jest.fn(),
          },
        },
        {
          provide: AiMessageRepository,
          useValue: {
            create: jest.fn(),
            findByConversation: jest.fn().mockResolvedValue([]),
            findRecent: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AiSettingRepository,
          useValue: {
            get: jest.fn().mockResolvedValue({ chatbox_enabled: true, system_prompt: null }),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AiChatService);
    conversationRepo = module.get(AiConversationRepository);
    messageRepo = module.get(AiMessageRepository);
    settingRepo = module.get(AiSettingRepository);
    productService = module.get(ProductService);
  });

  afterEach(() => jest.restoreAllMocks());

  const guest = { userId: null, sessionId: 's1' } as const;

  it('retrieves products via ProductService and returns reply + products', async () => {
    mockFetchReply('Đây là vài mẫu áo thun đen.');

    const res = await service.chat({ message: 'áo thun đen dưới 300k' }, guest);

    // Keyword retrieval: the sentence is reduced to keywords (price stripped)
    // and each is searched with the parsed price hint.
    expect(productService.findActiveProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'áo', max_price: 300000 }),
    );
    expect(productService.findActiveProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'thun', max_price: 300000 }),
    );
    expect(res.reply).toContain('áo thun');
    // Same product returned per keyword → merged & de-duplicated to one.
    expect(res.products).toHaveLength(1);
    expect(res.conversation_id).toBe(10);
    // Persists both the user and assistant turns.
    expect(messageRepo.create).toHaveBeenCalledTimes(2);
    expect(conversationRepo.touch).toHaveBeenCalledWith(10);
  });

  it('falls back gracefully (HTTP 200, still persists) when the LLM call fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'boom',
    }) as unknown as typeof fetch;

    const res = await service.chat({ message: 'hello' }, guest);

    expect(res.reply).toMatch(/không khả dụng|thử lại/i);
    expect(messageRepo.create).toHaveBeenCalledTimes(2);
  });

  it('throws CHATBOT_005 when the chatbox is disabled', async () => {
    settingRepo.get.mockResolvedValueOnce({ chatbox_enabled: false, system_prompt: null } as any);

    await expect(service.chat({ message: 'hi' }, guest)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws CHATBOT_004 when the API key is missing', async () => {
    apiKey = '';
    mockFetchReply('unused');

    await expect(service.chat({ message: 'hi' }, guest)).rejects.toMatchObject({
      response: { code: 'CHATBOT_004' },
    });
  });

  it('self-heals a stale/non-owned conversation_id by starting a fresh thread', async () => {
    mockFetchReply('ok');
    // Conversation owned by user 99 but caller is guest s1 → treat as stale.
    conversationRepo.findById.mockResolvedValue({
      id: 7,
      user_id: 99,
      session_id: null,
    } as any);

    const res = await service.chat({ message: 'hi', conversation_id: 7 }, guest);

    expect(conversationRepo.create).toHaveBeenCalled();
    expect(res.conversation_id).toBe(10); // the freshly-created thread
  });

  it('enforces ownership on resume (CHATBOT_003)', async () => {
    conversationRepo.findById.mockResolvedValue({
      id: 5,
      user_id: 99,
      session_id: null,
    } as any);

    await expect(
      service.getConversation(5, { userId: 1, sessionId: null }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
