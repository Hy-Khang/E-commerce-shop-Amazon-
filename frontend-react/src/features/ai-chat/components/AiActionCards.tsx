import { LogIn, PackageX } from 'lucide-react';
import { useAiChatStore } from '../stores/ai-chat.store';
import { AiCartUpdateCard } from './AiCartUpdateCard';
import { AiCheckoutProposalCard } from './AiCheckoutProposalCard';
import { AiOrderPlacedCard } from './AiOrderPlacedCard';
import type { AgentAction, AiOrderPlaced } from '../types/ai-chat.types';

interface Props {
  actions: AgentAction[];
  /** Owning message id — lets a card swap itself in the store (e.g. the
   *  checkout proposal becomes an "order placed" card once confirmed). */
  messageId?: string;
  onNavigate?: () => void;
  onPickSuggestion?: (text: string) => void;
}

/** Renders the agent's action cards beneath an assistant bubble. */
export function AiActionCards({ actions, messageId, onNavigate, onPickSuggestion }: Props) {
  const updateMessage = useAiChatStore((s) => s.updateMessage);
  const openLoginPrompt = useAiChatStore((s) => s.openLoginPrompt);

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
            return (
              <div
                key={i}
                className="mt-2 rounded-xl border border-border-default bg-surface p-3"
              >
                <p className="text-xs text-text-secondary">
                  You need to sign in to use this feature.
                </p>
                <button
                  type="button"
                  onClick={openLoginPrompt}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  <LogIn className="h-3.5 w-3.5" /> Sign in
                </button>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
