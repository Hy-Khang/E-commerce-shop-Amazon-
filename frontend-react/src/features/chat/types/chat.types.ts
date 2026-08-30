export type SenderType = 'customer' | 'seller';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Conversation {
  id: number;
  shop_id: number;
  shop_name: string;
  shop_logo_url: string | null;
  customer_id: number;
  counterpart_name: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: SenderType;
  content: string;
  status: MessageStatus;
  created_at: string;
}

export interface ChatUnreadCount {
  count: number;
}

// ─── Socket event contract (must match backend CHAT_EVENTS) ───

export const CHAT_EVENTS = {
  NewMessage: 'chat:new_message',
  Read: 'chat:read',
  Typing: 'chat:typing',
  Presence: 'chat:presence',
  Join: 'chat:join',
  Leave: 'chat:leave',
} as const;

export interface PresencePayload {
  conversationId: number;
  userId: number;
  online: boolean;
}

export interface TypingPayload {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

export interface ReadPayload {
  conversationId: number;
  status: MessageStatus;
}
