import { useMutation, useQuery } from '@tanstack/react-query';
import { aiChatService } from '../services/ai-chat.service';
import { useAiChatStore } from '../stores/ai-chat.store';
import type { ChatResponse } from '../types/ai-chat.types';

export const aiChatKeys = {
  all: ['ai-chat'] as const,
  config: () => [...aiChatKeys.all, 'config'] as const,
};

/** Widget gate — is the chatbox enabled? Public (guest + customer). */
export function useAiConfig() {
  return useQuery({
    queryKey: aiChatKeys.config(),
    queryFn: () => aiChatService.getConfig(),
    staleTime: 5 * 60 * 1000,
    select: (res) => res.data.data,
  });
}

const uid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function messageForError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 429) {
    return 'Bạn đang gửi quá nhanh. Vui lòng đợi một chút rồi thử lại nhé.';
  }
  return 'Xin lỗi, đã có lỗi xảy ra. Bạn vui lòng thử lại sau nhé.';
}

/**
 * Send a message with optimistic UI: append the user's message + a pending
 * assistant bubble, then fill the assistant bubble from the server reply (or a
 * friendly error). No socket — a single request/response.
 */
export function useSendAiMessage() {
  const addMessage = useAiChatStore((s) => s.addMessage);
  const updateMessage = useAiChatStore((s) => s.updateMessage);
  const setConversationId = useAiChatStore((s) => s.setConversationId);
  const setPendingIntent = useAiChatStore((s) => s.setPendingIntent);

  return useMutation<ChatResponse, unknown, string, { assistantId: string }>({
    meta: { suppressToast: true },
    mutationFn: (message) => {
      const conversationId = useAiChatStore.getState().conversationId ?? undefined;
      return aiChatService
        .sendMessage({ message, conversation_id: conversationId })
        .then((res) => res.data.data);
    },
    onMutate: (message) => {
      const assistantId = uid();
      addMessage({ id: uid(), role: 'user', content: message });
      addMessage({ id: assistantId, role: 'assistant', content: '', pending: true });
      return { assistantId };
    },
    onSuccess: (data, message, ctx) => {
      setConversationId(data.conversation_id);
      updateMessage(ctx.assistantId, {
        content: data.reply,
        products: data.products,
        actions: data.actions,
        pending: false,
      });
      // A guest hit a customer-only tool (e.g. checkout). Remember this message
      // so we can auto-resend it right after they sign in — the agent then
      // continues the interrupted action instead of the user re-typing it.
      if (data.actions?.some((a) => a.type === 'needs_login')) {
        setPendingIntent(message);
      }
    },
    onError: (error, _message, ctx) => {
      if (ctx) {
        updateMessage(ctx.assistantId, {
          content: messageForError(error),
          pending: false,
        });
      }
    },
  });
}
