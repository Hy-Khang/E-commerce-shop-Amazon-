import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import { useChatStore } from '../stores/chat.store';
import { useAuthStore } from '@/features/auth';
import type { PaginationMeta } from '@/core/api/api.types';
import type { Conversation, Message } from '../types/chat.types';

export interface MessagesPage {
  data: Message[]; // chronological (oldest → newest)
  meta: PaginationMeta;
}

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => ['chat', 'conversations'] as const,
  messages: (conversationId: number) =>
    ['chat', 'messages', conversationId] as const,
  unreadCount: () => ['chat', 'unread-count'] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => chatService.getConversations().then((res) => res.data.data),
    staleTime: 30 * 1000,
  });
}

export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? 0),
    queryFn: async (): Promise<MessagesPage> => {
      const res = await chatService.getMessages(conversationId!);
      // Server returns newest-first; reverse for chronological display.
      return { data: [...res.data.data].reverse(), meta: res.data.meta };
    },
    enabled: conversationId != null,
    staleTime: 0,
  });
}

export function useChatUnreadCount() {
  const setUnreadTotal = useChatStore((s) => s.setUnreadTotal);
  return useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: async () => {
      const res = await chatService.getUnreadCount();
      const count = res.data.data.count;
      setUnreadTotal(count);
      return count;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shopId: number) =>
      chatService.startConversation(shopId).then((res) => res.data.data),
    onSuccess: (conversation: Conversation) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      return conversation;
    },
  });
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      chatService.sendMessage(conversationId, content).then((res) => res.data.data),
    meta: { suppressToast: true },
    onMutate: async (content: string) => {
      const key = chatKeys.messages(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagesPage>(key);

      // Optimistic temp bubble with a negative id (replaced on settle).
      const tempId = -Date.now();
      const myId = useAuthStore.getState().user?.id ?? 0;
      const optimistic: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: myId,
        sender_type: 'customer',
        content,
        status: 'sent',
        created_at: new Date().toISOString(),
      };

      if (previous) {
        queryClient.setQueryData<MessagesPage>(key, {
          ...previous,
          data: [...previous.data, optimistic],
        });
      }
      return { previous, tempId };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          chatKeys.messages(conversationId),
          context.previous,
        );
      }
    },
    onSuccess: (message, _content, context) => {
      // Replace the temp bubble with the server message (dedup by id).
      const key = chatKeys.messages(conversationId);
      const current = queryClient.getQueryData<MessagesPage>(key);
      if (!current) return;
      const withoutTemp = current.data.filter((m) => m.id !== context?.tempId);
      const exists = withoutTemp.some((m) => m.id === message.id);
      queryClient.setQueryData<MessagesPage>(key, {
        ...current,
        data: exists ? withoutTemp : [...withoutTemp, message],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) =>
      chatService.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
    },
  });
}
