import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { useMergeCart } from '@/features/cart/hooks/useMergeCart';
import { cartKeys } from '@/features/cart/hooks/useCart';
import type { LoginRequest } from '../types/auth.types';
import { ROUTES } from '@/common/constants/routes';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const { mutateAsync: mergeCart } = useMergeCart();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    meta: { suppressToast: true },
    onSuccess: async (response) => {
      login(response.data.data);
      
      const sessionId = localStorage.getItem('session_id');
      if (sessionId) {
        try {
          await mergeCart(sessionId);
          // Invalidate cart queries after merge
          queryClient.invalidateQueries({ queryKey: cartKeys.current() });
        } catch (error) {
          console.error('Failed to merge cart:', error);
        }
      }

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.HOME;
      navigate(from, { replace: true });
    },
  });
}
