import { Check, CheckCheck } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import type { Message } from '../types/chat.types';

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
          isOwn
            ? 'bg-brand text-white'
            : 'bg-surface-hover text-text-primary'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? 'text-white/70' : 'text-text-muted'
          }`}
        >
          <span>{formatDate(message.created_at)}</span>
          {isOwn && <StatusTick status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function StatusTick({ status }: { status: Message['status'] }) {
  if (status === 'read') {
    return <CheckCheck className="h-3 w-3 text-sky-300" aria-label="Read" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-3 w-3" aria-label="Delivered" />;
  }
  return <Check className="h-3 w-3" aria-label="Sent" />;
}
