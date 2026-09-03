import { MessageCircle, X } from 'lucide-react';
import { useAiConfig } from '../hooks/useAiChat';
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
