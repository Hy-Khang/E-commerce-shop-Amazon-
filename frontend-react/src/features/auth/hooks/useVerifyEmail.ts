import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { useMergeCart } from '@/features/cart/hooks/useMergeCart';
import { cartKeys } from '@/features/cart/hooks/useCart';
import type { VerifyEmailRequest } from '../types/auth.types';
import { ROUTES } from '@/common/constants/routes';

export function useVerifyEmail() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { mutateAsync: mergeCart } = useMergeCart();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => authService.verifyEmail(data),
    meta: { suppressToast: true },
    onSuccess: async (response) => {
      login(response.data.data);

      const sessionId = localStorage.getItem('session_id');
      if (sessionId) {
        try {
          await mergeCart(sessionId);
          queryClient.invalidateQueries({ queryKey: cartKeys.current() });
        } catch {
          // cart merge is best-effort
        }
      }

      navigate(ROUTES.HOME, { replace: true });
    },
  });
}
