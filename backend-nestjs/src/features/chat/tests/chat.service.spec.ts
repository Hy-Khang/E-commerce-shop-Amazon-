import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from '../chat.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ChatGateway } from '../chat.gateway';
import { ShopService } from '../../shop/shop.service';
import { MessageStatus, SenderType } from '../types/chat.types';
import type { Conversation } from '../entities/conversation.entity';
import type { Message } from '../entities/message.entity';
import type { Shop } from '../../shop/entities/shop.entity';

const CUSTOMER_ID = 2;
const SELLER_USER_ID = 9;
const SHOP_ID = 1;

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 1,
    customer_id: CUSTOMER_ID,
    shop_id: SHOP_ID,
    last_message_at: null,
    last_message_preview: null,
    customer_unread: 0,
    seller_unread: 0,
    created_at: new Date('2026-08-28T09:00:00Z'),
    ...overrides,
  } as Conversation;
}

function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: SHOP_ID,
    user_id: SELLER_USER_ID,
    name: 'Shop Thời Trang Hằng',
    slug: 'shop-thoi-trang-hang',
    status: 'active',
    logo_url: null,
    ...overrides,
  } as Shop;
}

describe('ChatService', () => {
  let service: ChatService;
  let conversationRepository: jest.Mocked<ConversationRepository>;
  let messageRepository: jest.Mocked<MessageRepository>;
  let chatGateway: jest.Mocked<ChatGateway>;
  let shopService: jest.Mocked<ShopService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ConversationRepository,
          useValue: {
            findById: jest.fn(),
            findOrCreate: jest.fn(),
            listForParticipant: jest.fn(),
            bumpOnNewMessage: jest.fn(),
            resetUnread: jest.fn(),
            sumUnreadForParticipant: jest.fn(),
          },
        },
        {
          provide: MessageRepository,
          useValue: {
            create: jest.fn(),
            findByConversationPaginated: jest.fn(),
            updateStatus: jest.fn(),
            markConversationRead: jest.fn(),
          },
        },
        {
          provide: ChatGateway,
          useValue: {
            resolveDeliveryStatus: jest.fn(),
            emitNewMessage: jest.fn(),
            emitRead: jest.fn(),
          },
        },
        {
          provide: ShopService,
          useValue: {
            findShopById: jest.fn(),
            findShopByUserIdOrNull: jest.fn(),
            assertShopIsActive: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ChatService);
    conversationRepository = module.get(ConversationRepository);
    messageRepository = module.get(MessageRepository);
    chatGateway = module.get(ChatGateway);
    shopService = module.get(ShopService);
  });

  describe('assertParticipant', () => {
    it('throws CHAT_001 when the conversation does not exist', async () => {
      conversationRepository.findById.mockResolvedValue(null);
      await expect(service.assertParticipant(CUSTOMER_ID, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('resolves the customer side with the shop owner as recipient', async () => {
      conversationRepository.findById.mockResolvedValue(makeConversation());
      shopService.findShopById.mockResolvedValue(makeShop());

      const result = await service.assertParticipant(CUSTOMER_ID, 1);

      expect(result.side).toBe(SenderType.Customer);
      expect(result.recipientUserId).toBe(SELLER_USER_ID);
    });

    it('resolves the seller side with the customer as recipient', async () => {
      conversationRepository.findById.mockResolvedValue(makeConversation());
      shopService.findShopByUserIdOrNull.mockResolvedValue(makeShop());

      const result = await service.assertParticipant(SELLER_USER_ID, 1);

      expect(result.side).toBe(SenderType.Seller);
      expect(result.recipientUserId).toBe(CUSTOMER_ID);
    });

    it('throws CHAT_002 when the caller is neither customer nor shop owner', async () => {
      conversationRepository.findById.mockResolvedValue(makeConversation());
      shopService.findShopByUserIdOrNull.mockResolvedValue(null);

      await expect(service.assertParticipant(999, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('startConversation', () => {
    it('throws CHAT_003 when a user chats with their own shop', async () => {
      shopService.findShopById.mockResolvedValue(
        makeShop({ user_id: CUSTOMER_ID }),
      );

      await expect(
        service.startConversation(CUSTOMER_ID, SHOP_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('finds or creates the conversation and returns the customer-side dto', async () => {
      shopService.findShopById.mockResolvedValue(makeShop());
      conversationRepository.findOrCreate.mockResolvedValue(makeConversation());

      const dto = await service.startConversation(CUSTOMER_ID, SHOP_ID);

      expect(shopService.assertShopIsActive).toHaveBeenCalled();
      expect(conversationRepository.findOrCreate).toHaveBeenCalledWith(
        CUSTOMER_ID,
        SHOP_ID,
      );
      expect(dto.shop_id).toBe(SHOP_ID);
      expect(dto.counterpart_name).toBe('Shop Thời Trang Hằng');
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      conversationRepository.findById.mockResolvedValue(makeConversation());
      shopService.findShopById.mockResolvedValue(makeShop());
      messageRepository.create.mockImplementation(
        async (data) =>
          ({
            id: 10,
            created_at: new Date('2026-08-28T09:07:00Z'),
            ...data,
          }) as Message,
      );
    });

    it('increments the recipient unread when they are not viewing the thread', async () => {
      chatGateway.resolveDeliveryStatus.mockReturnValue(
        MessageStatus.Delivered,
      );

      await service.sendMessage(CUSTOMER_ID, 1, 'Hello shop');

      // Recipient (seller) unread should be incremented.
      expect(conversationRepository.bumpOnNewMessage).toHaveBeenCalledWith(
        1,
        SenderType.Seller,
        expect.any(String),
        expect.any(Date),
        true,
      );
      expect(messageRepository.updateStatus).toHaveBeenCalledWith(
        10,
        MessageStatus.Delivered,
      );
      expect(chatGateway.emitNewMessage).toHaveBeenCalled();
    });

    it('does NOT increment unread when the recipient is viewing (message is read)', async () => {
      chatGateway.resolveDeliveryStatus.mockReturnValue(MessageStatus.Read);

      await service.sendMessage(CUSTOMER_ID, 1, 'Hello shop');

      expect(conversationRepository.bumpOnNewMessage).toHaveBeenCalledWith(
        1,
        SenderType.Seller,
        expect.any(String),
        expect.any(Date),
        false,
      );
    });

    it('leaves status as sent (no updateStatus) when recipient is offline', async () => {
      chatGateway.resolveDeliveryStatus.mockReturnValue(MessageStatus.Sent);

      await service.sendMessage(CUSTOMER_ID, 1, 'Hello shop');

      expect(messageRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('markRead', () => {
    beforeEach(() => {
      conversationRepository.findById.mockResolvedValue(makeConversation());
      shopService.findShopById.mockResolvedValue(makeShop());
    });

    it('emits a read receipt to the counterpart when messages were updated', async () => {
      messageRepository.markConversationRead.mockResolvedValue(2);

      await service.markRead(CUSTOMER_ID, 1);

      expect(conversationRepository.resetUnread).toHaveBeenCalledWith(
        1,
        SenderType.Customer,
      );
      expect(chatGateway.emitRead).toHaveBeenCalledWith(
        1,
        SELLER_USER_ID,
        MessageStatus.Read,
      );
    });

    it('does not emit when nothing was unread', async () => {
      messageRepository.markConversationRead.mockResolvedValue(0);

      await service.markRead(CUSTOMER_ID, 1);

      expect(chatGateway.emitRead).not.toHaveBeenCalled();
    });
  });
});
