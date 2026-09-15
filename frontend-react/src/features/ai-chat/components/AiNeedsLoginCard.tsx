import { CheckCircle2, LogIn } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useAiChatStore } from '../stores/ai-chat.store';

/**
 * The agent's `needs_login` card (a guest hit a customer-only tool). Once the
 * shopper signs in — via this card's button or any other in-widget prompt — it
 * flips to a "signed in" success state, mirroring how the checkout proposal
 * becomes an "order placed" card, so a resolved card never leaves a stale
 * "Sign in" button that no longer does anything. Auth state is global and
 * reactive, so this needs no message-swap plumbing.
 */
export function AiNeedsLoginCard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginPrompt = useAiChatStore((s) => s.openLoginPrompt);

  if (isAuthenticated) {
    return (
      <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Signed in — you can continue now.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-border-default bg-surface p-3">
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
}
