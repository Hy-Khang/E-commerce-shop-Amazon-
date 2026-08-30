import { api } from '@/core/api/axios-instance';
import type {
  SuccessResponse,
  PaginatedResponse,
} from '@/core/api/api.types';
import type {
  ChatUnreadCount,
  Conversation,
  Message,
} from '../types/chat.types';

export const chatService = {
  startConversation: (shopId: number) =>
    api.post<SuccessResponse<Conversation>>('/chat/conversations', {
      shop_id: shopId,
    }),

  getConversations: () =>
    api.get<SuccessResponse<Conversation[]>>('/chat/conversations'),

  getMessages: (conversationId: number, page = 1, limit = 30) =>
    api.get<PaginatedResponse<Message>>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, limit } },
    ),

  sendMessage: (conversationId: number, content: string) =>
    api.post<SuccessResponse<Message>>(
      `/chat/conversations/${conversationId}/messages`,
      { content },
    ),

  markRead: (conversationId: number) =>
    api.patch(`/chat/conversations/${conversationId}/read`),

  getUnreadCount: () =>
    api.get<SuccessResponse<ChatUnreadCount>>('/chat/unread-count'),
};
