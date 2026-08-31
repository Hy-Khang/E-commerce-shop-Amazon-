import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiChatService } from '../services/ai-chat.service';
import {
  showErrorToast,
  showSuccessToast,
} from '@/common/components/feedback/toast';
import type { PaginationParams } from '@/common/types/common.types';
import type {
  AiSettings,
  UpdateAiSettingsRequest,
} from '../types/ai-chat.types';

export const adminAiKeys = {
  all: ['admin-ai'] as const,
  conversations: (params: PaginationParams) =>
    [...adminAiKeys.all, 'conversations', params] as const,
  conversation: (id: number) =>
    [...adminAiKeys.all, 'conversation', id] as const,
  settings: () => [...adminAiKeys.all, 'settings'] as const,
};

export function useAdminAiConversations(params: PaginationParams) {
  return useQuery({
    queryKey: adminAiKeys.conversations(params),
    queryFn: () => aiChatService.adminListConversations(params),
    select: (res) => res.data,
  });
}

export function useAdminAiConversation(id: number) {
  return useQuery({
    queryKey: adminAiKeys.conversation(id),
    queryFn: () => aiChatService.adminGetConversation(id),
    select: (res) => res.data.data,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useAiSettings() {
  return useQuery({
    queryKey: adminAiKeys.settings(),
    queryFn: () => aiChatService.getSettings(),
    staleTime: 60 * 1000,
    select: (res) => res.data.data,
  });
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient();

  return useMutation<AiSettings, Error, UpdateAiSettingsRequest>({
    mutationFn: (data) =>
      aiChatService.updateSettings(data).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAiKeys.settings() });
      showSuccessToast('AI chatbox settings updated');
    },
    onError: (error) => showErrorToast(error),
  });
}
