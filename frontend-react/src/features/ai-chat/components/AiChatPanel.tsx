import { Bot, RotateCcw, X } from 'lucide-react';
import { useAiChatStore } from '../stores/ai-chat.store';
import { useSendAiMessage } from '../hooks/useAiChat';
import { AiMessageList } from './AiMessageList';
import { AiChatInput } from './AiChatInput';

export function AiChatPanel() {
  const messages = useAiChatStore((s) => s.messages);
  const close = useAiChatStore((s) => s.close);
  const reset = useAiChatStore((s) => s.reset);
  const send = useSendAiMessage();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-default bg-surface shadow-xl">
      <header className="flex items-center gap-2 border-b border-border-default bg-brand px-4 py-3 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">Trợ lý mua sắm AI</p>
          <p className="text-xs text-white/80">Luôn sẵn sàng hỗ trợ</p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15"
          aria-label="Cuộc trò chuyện mới"
          title="Cuộc trò chuyện mới"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={close}
          className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15"
          aria-label="Đóng"
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
    </div>
  );
}
