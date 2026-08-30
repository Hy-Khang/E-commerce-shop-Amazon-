import { Store } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import type { Conversation } from '../types/chat.types';

interface Props {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Store className="h-10 w-10 text-text-muted/60" />
        <p className="mt-3 text-sm font-semibold text-text-primary">
          No conversations yet
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Start a chat from any shop page.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-default">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c)}
            className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-hover ${
              activeId === c.id ? 'bg-surface-hover' : ''
            }`}
          >
            <Avatar name={c.counterpart_name} logo={c.shop_logo_url} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {c.counterpart_name}
                </p>
                {c.last_message_at && (
                  <span className="flex-shrink-0 text-[10px] text-text-muted">
                    {formatDate(c.last_message_at)}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-text-secondary">
                  {c.last_message_preview ?? 'No messages yet'}
                </p>
                {c.unread_count > 0 && (
                  <span className="flex h-4 min-w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                    {c.unread_count > 99 ? '99+' : c.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Avatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="h-10 w-10 flex-shrink-0 rounded-full border border-border-default object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-light">
      <Store className="h-5 w-5 text-text-brand" />
    </div>
  );
}
