import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth';
import { connectSocket } from '@/core/socket/socket.service';
import { useChatStore } from '../stores/chat.store';
import { chatKeys, type MessagesPage } from './useChat';
import {
  CHAT_EVENTS,
  type Message,
  type PresencePayload,
  type ReadPayload,
  type TypingPayload,
} from '../types/chat.types';

/**
 * Global chat realtime layer — mounts once (AppProviders). Attaches listeners
 * to the SHARED socket and only ever removes its own listeners on cleanup; it
 * never calls disconnectSocket (the notifications hook owns the connection
 * lifecycle, so disconnecting here would drop notifications too).
 */
export function useRealtimeChat() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    let socket: ReturnType<typeof connectSocket>;
    try {
      socket = connectSocket();
    } catch {
      return;
    }

    const myId = useAuthStore.getState().user?.id ?? 0;

    const handleNewMessage = (message: Message) => {
      const key = chatKeys.messages(message.conversation_id);
      const current = queryClient.getQueryData<MessagesPage>(key);
      if (current) {
        // Dedup: drop optimistic temps (negative id) with matching content,
        // then add the real message only if not already present (self-echo).
        const cleaned = current.data.filter(
          (m) =>
            !(
              m.id < 0 &&
              m.sender_id === message.sender_id &&
              m.content === message.content
            ),
        );
        const exists = cleaned.some((m) => m.id === message.id);
        queryClient.setQueryData<MessagesPage>(key, {
          ...current,
          data: exists ? cleaned : [...cleaned, message],
        });
      }

      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });

      // Badge + toast only for messages from the other party, and only when
      // that conversation isn't the one currently open.
      const { activeConversationId, unreadTotal, setUnreadTotal } =
        useChatStore.getState();
      if (
        message.sender_id !== myId &&
        message.conversation_id !== activeConversationId
      ) {
        setUnreadTotal(unreadTotal + 1);
        toast(message.content, { duration: 4000 });
      }
    };

    const handleRead = (payload: ReadPayload) => {
      const key = chatKeys.messages(payload.conversationId);
      const current = queryClient.getQueryData<MessagesPage>(key);
      if (!current) return;
      // Advance my own delivered/sent bubbles to read.
      queryClient.setQueryData<MessagesPage>(key, {
        ...current,
        data: current.data.map((m) =>
          m.sender_id === myId ? { ...m, status: payload.status } : m,
        ),
      });
    };

    const handleTyping = (payload: TypingPayload) => {
      if (payload.userId === myId) return;
      useChatStore.getState().setTyping(payload.conversationId, payload.isTyping);
    };

    const handlePresence = (payload: PresencePayload) => {
      if (payload.userId === myId) return;
      useChatStore
        .getState()
        .setConversationOnline(payload.conversationId, payload.online);
    };

    socket.on(CHAT_EVENTS.NewMessage, handleNewMessage);
    socket.on(CHAT_EVENTS.Read, handleRead);
    socket.on(CHAT_EVENTS.Typing, handleTyping);
    socket.on(CHAT_EVENTS.Presence, handlePresence);

    return () => {
      socket.off(CHAT_EVENTS.NewMessage, handleNewMessage);
      socket.off(CHAT_EVENTS.Read, handleRead);
      socket.off(CHAT_EVENTS.Typing, handleTyping);
      socket.off(CHAT_EVENTS.Presence, handlePresence);
    };
  }, [isAuthenticated, queryClient]);
}
