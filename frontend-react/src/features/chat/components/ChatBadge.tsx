import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useChatUnreadBadge } from '../hooks/useChat';

export function ChatBadge() {
  const unreadTotal = useChatUnreadBadge();

  return (
    <Link
      to={ROUTES.CHAT}
      className="relative rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
      aria-label="Messages"
    >
      <MessageCircle className="h-5 w-5" />
      {unreadTotal > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
          {unreadTotal > 99 ? '99+' : unreadTotal}
        </span>
      )}
    </Link>
  );
}
