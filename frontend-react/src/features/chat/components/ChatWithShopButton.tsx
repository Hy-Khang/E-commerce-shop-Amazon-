import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth';
import { ROUTES } from '@/common/constants/routes';
import { ApiError } from '@/core/api/api.types';
import { useStartConversation } from '../hooks/useChat';

interface Props {
  shopId: number;
  className?: string;
}

export function ChatWithShopButton({ shopId, className = '' }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const startConversation = useStartConversation();

  const handleClick = () => {
    if (!isAuthenticated) {
      // Preserve the current page so login returns here (useLogin reads state.from).
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }
    startConversation.mutate(shopId, {
      onSuccess: (conversation) => {
        navigate(ROUTES.CHAT_CONVERSATION(conversation.id));
      },
      onError: (err) => {
        const message =
          err instanceof ApiError ? err.message : 'Unable to start chat';
        toast.error(message);
      },
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={startConversation.isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border-brand px-4 py-2 text-sm font-semibold text-text-brand transition-colors hover:bg-brand-light disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      Chat with shop
    </button>
  );
}
