import { api } from '@/core/api/axios-instance';
import type {
  SuccessResponse,
  PaginatedResponse,
} from '@/core/api/api.types';
import type { PaginationParams } from '@/common/types/common.types';
import type {
  AiConfig,
  AiConversationDetail,
  AiConversationSummary,
  AiSettings,
  ChatResponse,
  SendMessageRequest,
  UpdateAiSettingsRequest,
} from '../types/ai-chat.types';

export const aiChatService = {
  // Public / customer
  getConfig: () => api.get<SuccessResponse<AiConfig>>('/ai/config'),

  sendMessage: (data: SendMessageRequest) =>
    api.post<SuccessResponse<ChatResponse>>('/ai/chat', data),

  getConversation: (id: number) =>
    api.get<SuccessResponse<AiConversationDetail>>(`/ai/conversations/${id}`),

  // Admin
  adminListConversations: (params: PaginationParams) =>
    api.get<PaginatedResponse<AiConversationSummary>>('/admin/ai/conversations', {
      params,
    }),

  adminGetConversation: (id: number) =>
    api.get<SuccessResponse<AiConversationDetail>>(
      `/admin/ai/conversations/${id}`,
    ),

  getSettings: () => api.get<SuccessResponse<AiSettings>>('/admin/ai/settings'),

  updateSettings: (data: UpdateAiSettingsRequest) =>
    api.patch<SuccessResponse<AiSettings>>('/admin/ai/settings', data),
};
