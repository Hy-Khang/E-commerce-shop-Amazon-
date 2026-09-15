import { useEffect } from 'react';
import { toast } from 'sonner';
import { MessageCircle, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useAiConfig, useSendAiMessage } from '../hooks/useAiChat';
import { useAiChatStore, type AiPanelSize } from '../stores/ai-chat.store';
import { AiChatPanel } from './AiChatPanel';

/**
 * Floating AI chatbox launcher, mounted once in MainLayout. Hidden entirely when
 * the admin has disabled the chatbox (`GET /ai/config`). Guest + customer.
 */
// Mobile is always near full-width; the size steps only apply from `sm:` up
// (where the expand button is shown). Base = normal; large/full add sm: overrides.
const BASE_SIZE =
  'fixed bottom-24 right-4 z-50 sm:right-6 h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))]';
const SIZE_CLASS: Record<AiPanelSize, string> = {
  normal: BASE_SIZE,
  large: `${BASE_SIZE} sm:h-[min(80vh,720px)] sm:w-[min(640px,calc(100vw-3rem))]`,
  full: `${BASE_SIZE} sm:h-[calc(100vh-7rem)] sm:w-[min(1100px,calc(100vw-3rem))]`,
};

export function AiChatWidget() {
  const { data: config } = useAiConfig();
  const isOpen = useAiChatStore((s) => s.isOpen);
  const size = useAiChatStore((s) => s.size);
  const toggle = useAiChatStore((s) => s.toggle);
  const send = useSendAiMessage();

  // Resume after an OAuth sign-in only. "Continue with Google/Facebook" is a
  // full-page redirect, so the in-panel resume never runs; on the fresh remount
  // the OAuth callback has already merged the guest cart, so a persisted
  // `pendingIntent` is safe to re-send here (reopen the chat + continue checkout).
  // Mount-only (not an isAuthenticated effect) so it never fires during an
  // in-widget email login — that path's cart merge is still in flight and is
  // handled by AiChatPanel.handleResumeAfterLogin after the merge completes.
  useEffect(() => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const { pendingIntent, setPendingIntent, open, closeLoginPrompt } =
      useAiChatStore.getState();
    if (!pendingIntent) return;
    setPendingIntent(null);
    closeLoginPrompt();
    open();
    toast.success('Signed in successfully');
    send.mutate(pendingIntent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!config?.enabled) return null;

  return (
    <>
      {isOpen && (
        <div className={SIZE_CLASS[size]}>
          <AiChatPanel />
        </div>
      )}

      <button
        onClick={toggle}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-colors hover:bg-brand-hover sm:right-6"
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
