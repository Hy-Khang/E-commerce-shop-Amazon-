import { Message } from '../entities/message.entity';
import { IConversationListRow } from '../repositories/conversation.repository';
import {
  ConversationResponseDto,
  MessageResponseDto,
} from '../dto/chat-response.dto';
import { SenderType } from '../types/chat.types';

/** Build a preview snippet (≤255 chars) from message content. */
export function buildPreview(content: string): string {
  const collapsed = content.replace(/\s+/g, ' ').trim();
  return collapsed.length > 255 ? collapsed.slice(0, 255) : collapsed;
}

/**
 * Map a joined conversation row to the response DTO for a given caller side.
 * The unread count and counterpart name depend on which side is asking.
 */
export function toConversationResponse(
  row: IConversationListRow,
  side: SenderType,
): ConversationResponseDto {
  const isCustomer = side === SenderType.Customer;
  return {
    id: row.id,
    shop_id: row.shop_id,
    shop_name: row.shop_name,
    shop_logo_url: row.shop_logo_url,
    customer_id: row.customer_id,
    counterpart_name: isCustomer ? row.shop_name : row.customer_name,
    last_message_preview: row.last_message_preview,
    last_message_at: row.last_message_at,
    unread_count: isCustomer ? row.customer_unread : row.seller_unread,
  };
}

export function toMessageResponse(message: Message): MessageResponseDto {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    sender_type: message.sender_type,
    content: message.content,
    status: message.status,
    created_at: message.created_at,
  };
}
