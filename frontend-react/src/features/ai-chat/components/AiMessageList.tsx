import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { AiMessageBubble } from './AiMessageBubble';
import type { AiChatMessage } from '../types/ai-chat.types';

interface Props {
  messages: AiChatMessage[];
  onNavigate?: () => void;
  onPickSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  'Gợi ý áo thun nam giá dưới 300k',
  'Chính sách đổi trả thế nào?',
  'Có những cách thanh toán nào?',
];

export function AiMessageList({ messages, onNavigate, onPickSuggestion }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll only this container (never scrollIntoView — that yanks the page).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-page px-3 py-4"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light">
            <Sparkles className="h-6 w-6 text-text-brand" />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            Trợ lý mua sắm AI
          </p>
          <p className="text-xs text-text-secondary">
            Mình có thể gợi ý sản phẩm và trả lời câu hỏi về sàn. Bạn cần tìm gì?
          </p>
          <ul className="mt-2 w-full space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => onPickSuggestion?.(s)}
                  disabled={!onPickSuggestion}
                  className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-left text-xs text-text-brand transition-colors hover:border-border-brand hover:bg-brand-light disabled:pointer-events-none"
                >
                  “{s}”
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        messages.map((m) => (
          <AiMessageBubble key={m.id} message={m} onNavigate={onNavigate} />
        ))
      )}
    </div>
  );
}
