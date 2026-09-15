import { Bot } from 'lucide-react';
import { AiProductSuggestions } from './AiProductSuggestions';
import { AiActionCards } from './AiActionCards';
import type { AiChatMessage } from '../types/ai-chat.types';

interface Props {
  message: AiChatMessage;
  onNavigate?: () => void;
  onPickSuggestion?: (text: string) => void;
  /** True only for the last message in the thread — gates quick-reply chips so
   *  a superseded question's chips can't be answered after scrolling past. */
  isLatest?: boolean;
}

export function AiMessageBubble({
  message,
  onNavigate,
  onPickSuggestion,
  isLatest = false,
}: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-light">
        <Bot className="h-4 w-4 text-text-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-surface-hover px-3 py-2 text-sm text-text-primary">
          {message.pending ? (
            <span className="flex items-center gap-1 py-0.5" aria-label="Typing">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </span>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        {message.products && message.products.length > 0 && (
          <AiProductSuggestions
            products={message.products}
            onNavigate={onNavigate}
            onPickSuggestion={onPickSuggestion}
          />
        )}
        {message.actions && message.actions.length > 0 && (
          <AiActionCards
            actions={message.actions}
            messageId={message.id}
            onNavigate={onNavigate}
            onPickSuggestion={onPickSuggestion}
            quickRepliesInteractive={isLatest}
          />
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted"
      style={delay ? { animationDelay: delay } : undefined}
    />
  );
}
