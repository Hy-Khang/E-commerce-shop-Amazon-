import { MessageCircle, X } from 'lucide-react';
import { useAiConfig } from '../hooks/useAiChat';
import { useAiChatStore } from '../stores/ai-chat.store';
import { AiChatPanel } from './AiChatPanel';

/**
 * Floating AI chatbox launcher, mounted once in MainLayout. Hidden entirely when
 * the admin has disabled the chatbox (`GET /ai/config`). Guest + customer.
 */
export function AiChatWidget() {
  const { data: config } = useAiConfig();
  const isOpen = useAiChatStore((s) => s.isOpen);
  const toggle = useAiChatStore((s) => s.toggle);

  if (!config?.enabled) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] sm:right-6">
          <AiChatPanel />
        </div>
      )}

      <button
        onClick={toggle}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-colors hover:bg-brand-hover sm:right-6"
        aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
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
