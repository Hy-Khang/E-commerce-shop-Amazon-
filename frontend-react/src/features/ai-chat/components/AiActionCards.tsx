import { PackageX } from 'lucide-react';
import { useAiChatStore } from '../stores/ai-chat.store';
import { AiCartUpdateCard } from './AiCartUpdateCard';
import { AiCheckoutProposalCard } from './AiCheckoutProposalCard';
import { AiOrderPlacedCard } from './AiOrderPlacedCard';
import { AiQuickRepliesCard } from './AiQuickRepliesCard';
import { AiNeedsLoginCard } from './AiNeedsLoginCard';
import type { AgentAction, AiOrderPlaced } from '../types/ai-chat.types';

interface Props {
  actions: AgentAction[];
  /** Owning message id — lets a card swap itself in the store (e.g. the
   *  checkout proposal becomes an "order placed" card once confirmed). */
  messageId?: string;
  onNavigate?: () => void;
  onPickSuggestion?: (text: string) => void;
  /** Only the latest turn's quick-reply chips answer the pending question;
   *  earlier ones render inert. Defaults to true. */
  quickRepliesInteractive?: boolean;
}

/** Renders the agent's action cards beneath an assistant bubble. */
export function AiActionCards({
  actions,
  messageId,
  onNavigate,
  onPickSuggestion,
  quickRepliesInteractive = true,
}: Props) {
  const updateMessage = useAiChatStore((s) => s.updateMessage);

  if (!actions.length) return null;

  // Replace the checkout proposal at `index` with an order-placed card, so a
  // completed order never re-renders a stale confirm form (persists to storage).
  const markPlaced = (index: number, data: AiOrderPlaced) => {
    if (!messageId) return;
    const next = actions.map((a, i) =>
      i === index ? { type: 'order_placed' as const, data } : a,
    );
    updateMessage(messageId, { actions: next });
  };

  return (
    <div className="space-y-2">
      {actions.map((action, i) => {
        switch (action.type) {
          case 'cart_updated':
            return (
              <AiCartUpdateCard key={i} cart={action.data} onNavigate={onNavigate} />
            );
          case 'checkout_proposal':
            return (
              <AiCheckoutProposalCard
                key={i}
                proposal={action.data}
                onNavigate={onNavigate}
                onPlaced={messageId ? (data) => markPlaced(i, data) : undefined}
              />
            );
          case 'order_placed':
            return (
              <AiOrderPlacedCard
                key={i}
                order={action.data}
                onNavigate={onNavigate}
                onPickSuggestion={onPickSuggestion}
              />
            );
          case 'quick_replies':
            return (
              <AiQuickRepliesCard
                key={i}
                prompt={action.data.prompt}
                options={action.data.options}
                onPick={onPickSuggestion}
                interactive={quickRepliesInteractive}
              />
            );
          case 'order_cancelled':
            return (
              <div
                key={i}
                className="mt-2 flex items-center gap-1.5 rounded-xl border border-border-default bg-surface p-3 text-xs font-medium text-text-primary"
              >
                <PackageX className="h-4 w-4 text-rose-500" />
                Order #{action.data.order_id} cancelled
              </div>
            );
          case 'needs_login':
            return <AiNeedsLoginCard key={i} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
