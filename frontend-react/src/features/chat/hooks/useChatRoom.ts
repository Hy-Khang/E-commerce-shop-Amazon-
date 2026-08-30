import { useCallback, useEffect, useRef } from 'react';
import { getSocket } from '@/core/socket/socket.service';
import { CHAT_EVENTS } from '../types/chat.types';

/**
 * Join a conversation's realtime room while the thread is open. Re-joins on
 * socket reconnect so presence/typing resume, leaves on unmount, and returns a
 * debounced typing emitter. Uses the shared socket — never connects/disconnects.
 */
export function useChatRoom(conversationId: number | null) {
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTyping = useRef(false);

  useEffect(() => {
    if (conversationId == null) return;
    const socket = getSocket();
    if (!socket) return;

    const join = () => socket.emit(CHAT_EVENTS.Join, { conversationId });
    join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      socket.emit(CHAT_EVENTS.Leave, { conversationId });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (lastTyping.current) {
        socket.emit(CHAT_EVENTS.Typing, { conversationId, isTyping: false });
        lastTyping.current = false;
      }
    };
  }, [conversationId]);

  const emitTyping = useCallback(() => {
    if (conversationId == null) return;
    const socket = getSocket();
    if (!socket) return;

    if (!lastTyping.current) {
      socket.emit(CHAT_EVENTS.Typing, { conversationId, isTyping: true });
      lastTyping.current = true;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit(CHAT_EVENTS.Typing, { conversationId, isTyping: false });
      lastTyping.current = false;
    }, 2000);
  }, [conversationId]);

  return { emitTyping };
}
