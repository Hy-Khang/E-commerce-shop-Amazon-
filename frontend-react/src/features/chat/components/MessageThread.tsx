import { useEffect, useRef } from 'react';
import { Store } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useMessages, useSendMessage, useMarkRead } from '../hooks/useChat';
import { useChatRoom } from '../hooks/useChatRoom';
import { useChatStore } from '../stores/chat.store';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { PresenceDot } from './PresenceDot';
import type { Conversation } from '../types/chat.types';

interface Props {
  conversation: Conversation;
}

export function MessageThread({ conversation }: Props) {
  const conversationId = conversation.id;
  const myId = useAuthStore((s) => s.user?.id) ?? 0;

  const { data, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkRead();
  const { emitTyping } = useChatRoom(conversationId);

  const isTyping = useChatStore((s) => s.typingByConversation[conversationId]);
  const isOnline = useChatStore((s) => s.onlineByConversation[conversationId]);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = data?.data ?? [];
  const lastMessage = messages[messages.length - 1];

  // Mark this the active conversation (suppresses its own toasts/badge).
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);

  // Mark read on open and whenever the newest message is from the counterpart.
  useEffect(() => {
    if (lastMessage && lastMessage.sender_id !== myId) {
      markRead.mutate(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastMessage?.id, myId]);

  // Auto-scroll to the newest message / typing indicator — scroll only the
  // messages container (never scrollIntoView, which also scrolls the window
  // and would yank the whole page + header out of view).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isTyping]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border-default px-4 py-3">
        {conversation.shop_logo_url ? (
          <img
            src={conversation.shop_logo_url}
            alt=""
            className="h-9 w-9 rounded-full border border-border-default object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light">
            <Store className="h-5 w-5 text-text-brand" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-primary">
            {conversation.counterpart_name}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <PresenceDot online={!!isOnline} />
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scrollbar-grab min-h-0 flex-1 space-y-2 overflow-y-scroll bg-page px-4 py-4"
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Say hello 👋
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isOwn={m.sender_id === myId} />
          ))
        )}
        {isTyping && <TypingIndicator />}
      </div>

      <MessageInput
        onSend={(content) => sendMessage.mutate(content)}
        onTyping={emitTyping}
        disabled={sendMessage.isPending}
      />
    </div>
  );
}
