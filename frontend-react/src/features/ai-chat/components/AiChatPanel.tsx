import { Bot, Maximize2, Minimize2, RotateCcw, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useAiChatStore } from '../stores/ai-chat.store';
import { useSendAiMessage } from '../hooks/useAiChat';
import { AiMessageList } from './AiMessageList';
import { AiChatInput } from './AiChatInput';
import { AiLoginPrompt } from './AiLoginPrompt';

export function AiChatPanel() {
  const messages = useAiChatStore((s) => s.messages);
  const close = useAiChatStore((s) => s.close);
  const reset = useAiChatStore((s) => s.reset);
  const size = useAiChatStore((s) => s.size);
  const cycleSize = useAiChatStore((s) => s.cycleSize);
  const loginPromptOpen = useAiChatStore((s) => s.loginPromptOpen);
  const closeLoginPrompt = useAiChatStore((s) => s.closeLoginPrompt);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const send = useSendAiMessage();

  // After an in-widget sign-in, resume the action the guest was blocked on by
  // re-sending the remembered message (the agent then continues to checkout).
  const handleResumeAfterLogin = () => {
    closeLoginPrompt();
    const { pendingIntent, setPendingIntent } = useAiChatStore.getState();
    setPendingIntent(null);
    if (pendingIntent) send.mutate(pendingIntent);
  };

  // Cycle is normal → large → full → normal, so at `full` the next step shrinks.
  const atFull = size === 'full';
  const sizeLabel = atFull ? 'Minimize' : size === 'large' ? 'Expand more' : 'Expand';

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-default bg-surface shadow-xl">
      <header className="flex items-center gap-2 border-b border-border-default bg-brand px-4 py-3 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">AI Shopping Assistant</p>
          <p className="text-xs text-white/80">Always here to help</p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15"
          aria-label="New conversation"
          title="New conversation"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={cycleSize}
          className="hidden rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15 sm:inline-flex"
          aria-label={sizeLabel}
          title={sizeLabel}
        >
          {atFull ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={close}
          className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <AiMessageList
        messages={messages}
        onNavigate={close}
        onPickSuggestion={(text) => send.mutate(text)}
      />

      <AiChatInput
        onSend={(content) => send.mutate(content)}
        disabled={send.isPending}
      />

      {loginPromptOpen && !isAuthenticated && (
        <AiLoginPrompt
          onSuccess={handleResumeAfterLogin}
          onClose={closeLoginPrompt}
        />
      )}
    </div>
  );
}
