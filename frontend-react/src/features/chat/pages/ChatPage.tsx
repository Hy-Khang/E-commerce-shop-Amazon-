import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useConversations } from '../hooks/useChat';
import { ConversationList } from '../components/ConversationList';
import { MessageThread } from '../components/MessageThread';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useConversations();

  const activeId = conversationId ? Number(conversationId) : null;
  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="shop-container py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-primary">
        Messages
      </h1>

      <div className="grid h-[calc(100vh-16rem)] grid-cols-1 overflow-hidden rounded-xl border border-border-default bg-elevated shadow-sm md:grid-cols-[320px_1fr]">
        <aside
          className={`overflow-y-auto border-border-default md:border-r ${
            active ? 'hidden md:block' : 'block'
          }`}
        >
          {isLoading ? (
            <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={(c) => navigate(ROUTES.CHAT_CONVERSATION(c.id))}
            />
          )}
        </aside>

        <section className={active ? 'block' : 'hidden md:block'}>
          {active ? (
            <MessageThread conversation={active} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageSquare className="h-12 w-12 text-text-muted/60" />
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Select a conversation
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Choose a chat from the list to start messaging.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
