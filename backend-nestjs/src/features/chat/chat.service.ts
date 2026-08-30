import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';
import { ChatGateway } from './chat.gateway';
import { ShopService } from '../shop/shop.service';
import { Conversation } from './entities/conversation.entity';
import {
  ChatUnreadCountResponseDto,
  ConversationResponseDto,
  MessageResponseDto,
} from './dto/chat-response.dto';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import {
  buildPreview,
  toConversationResponse,
  toMessageResponse,
} from './utils/chat.util';
import { MessageStatus, SenderType } from './types/chat.types';

interface IParticipant {
  side: SenderType;
  recipientUserId: number;
  conversation: Conversation;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly shopService: ShopService,
  ) {}

  /**
   * Resolve the caller's relationship to a conversation. Throws CHAT_001 if it
   * doesn't exist, CHAT_002 if the caller is neither the customer nor the shop
   * owner. Returns the side, the recipient user id, and the loaded entity.
   */
  async assertParticipant(
    userId: number,
    conversationId: number,
  ): Promise<IParticipant> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        code: 'CHAT_001',
        message: 'Conversation not found',
      });
    }

    if (conversation.customer_id === userId) {
      const shop = await this.shopService.findShopById(conversation.shop_id);
      return {
        side: SenderType.Customer,
        recipientUserId: shop.user_id,
        conversation,
      };
    }

    const myShop = await this.shopService.findShopByUserIdOrNull(userId);
    if (myShop && conversation.shop_id === myShop.id) {
      return {
        side: SenderType.Seller,
        recipientUserId: conversation.customer_id,
        conversation,
      };
    }

    throw new ForbiddenException({
      code: 'CHAT_002',
      message: 'You are not a participant in this conversation',
    });
  }

  /** Customer starts (or re-opens) a conversation with a shop. Idempotent. */
  async startConversation(
    userId: number,
    shopId: number,
  ): Promise<ConversationResponseDto> {
    const shop = await this.shopService.findShopById(shopId);
    this.shopService.assertShopIsActive(shop);

    if (shop.user_id === userId) {
      throw new BadRequestException({
        code: 'CHAT_003',
        message: 'You cannot start a conversation with your own shop',
      });
    }

    const conversation = await this.conversationRepository.findOrCreate(
      userId,
      shopId,
    );

    return {
      id: conversation.id,
      shop_id: conversation.shop_id,
      shop_name: shop.name,
      shop_logo_url: shop.logo_url,
      customer_id: conversation.customer_id,
      counterpart_name: shop.name,
      last_message_preview: conversation.last_message_preview,
      last_message_at: conversation.last_message_at,
      unread_count: conversation.customer_unread,
    };
  }

  /** List the caller's conversations (as customer and/or as shop owner). */
  async listConversations(userId: number): Promise<ConversationResponseDto[]> {
    const myShop = await this.shopService.findShopByUserIdOrNull(userId);
    const rows = await this.conversationRepository.listForParticipant(
      userId,
      myShop?.id ?? null,
    );

    return rows.map((row) => {
      const side =
        row.customer_id === userId ? SenderType.Customer : SenderType.Seller;
      return toConversationResponse(row, side);
    });
  }

  /** Paginated message history for a conversation (membership enforced). */
  async getMessages(
    userId: number,
    conversationId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<MessageResponseDto>> {
    await this.assertParticipant(userId, conversationId);
    const result = await this.messageRepository.findByConversationPaginated(
      conversationId,
      page,
      limit,
    );
    return {
      data: result.data.map(toMessageResponse),
      meta: result.meta,
    };
  }

  /** Send a text message; persist, resolve delivery state, then emit. */
  async sendMessage(
    userId: number,
    conversationId: number,
    content: string,
  ): Promise<MessageResponseDto> {
    const { side, recipientUserId } = await this.assertParticipant(
      userId,
      conversationId,
    );

    const message = await this.messageRepository.create({
      conversation_id: conversationId,
      sender_id: userId,
      sender_type: side,
      content,
      status: MessageStatus.Sent,
    });

    // Recipient live-presence decides the initial receipt state.
    const delivery = this.chatGateway.resolveDeliveryStatus(
      recipientUserId,
      conversationId,
    );
    if (delivery !== MessageStatus.Sent) {
      await this.messageRepository.updateStatus(message.id, delivery);
      message.status = delivery;
    }

    const recipientSide =
      side === SenderType.Customer ? SenderType.Seller : SenderType.Customer;
    await this.conversationRepository.bumpOnNewMessage(
      conversationId,
      recipientSide,
      buildPreview(content),
      message.created_at,
      delivery !== MessageStatus.Read,
    );

    const dto = toMessageResponse(message);
    this.chatGateway.emitNewMessage(conversationId, recipientUserId, dto);
    return dto;
  }

  /** Mark the counterpart's messages read and reset the caller's unread. */
  async markRead(userId: number, conversationId: number): Promise<void> {
    const { side, recipientUserId } = await this.assertParticipant(
      userId,
      conversationId,
    );

    const affected = await this.messageRepository.markConversationRead(
      conversationId,
      userId,
    );
    await this.conversationRepository.resetUnread(conversationId, side);

    if (affected > 0) {
      this.chatGateway.emitRead(
        conversationId,
        recipientUserId,
        MessageStatus.Read,
      );
    }
  }

  /** Total unread across all the caller's conversations (both sides). */
  async getUnreadCount(userId: number): Promise<ChatUnreadCountResponseDto> {
    const myShop = await this.shopService.findShopByUserIdOrNull(userId);
    const count = await this.conversationRepository.sumUnreadForParticipant(
      userId,
      myShop?.id ?? null,
    );
    return { count };
  }
}
