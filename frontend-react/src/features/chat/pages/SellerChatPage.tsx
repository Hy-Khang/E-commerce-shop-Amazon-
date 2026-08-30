import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useConversations } from '../hooks/useChat';
import { ConversationList } from '../components/ConversationList';
import { MessageThread } from '../components/MessageThread';

/**
 * Seller-side chat. Lives inside the amber SellerLayout portal chrome but
 * reuses the storefront-styled ConversationList / MessageThread components —
 * a documented, deliberate exception to the two-design-language rule
 * (DESIGN.md §12), to be re-skinned later.
 */
export default function SellerChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: conversations = [], isLoading } = useConversations();

  const activeId = searchParams.get('c') ? Number(searchParams.get('c')) : null;
  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">
        Customer Messages
      </h1>

      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 overflow-hidden rounded-xl border border-border-default bg-elevated shadow-sm md:grid-cols-[320px_1fr]">
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
              onSelect={(c) => setSearchParams({ c: String(c.id) })}
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
                Choose a customer chat to reply.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
