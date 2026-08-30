import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { useMergeCart } from '@/features/cart/hooks/useMergeCart';
import { cartKeys } from '@/features/cart/hooks/useCart';
import { useMergeRecentlyViewed } from '@/features/recently-viewed/hooks/useMergeRecentlyViewed';
import type { LoginRequest } from '../types/auth.types';
import { ROUTES } from '@/common/constants/routes';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const { mutateAsync: mergeCart } = useMergeCart();
  const { mutateAsync: mergeRecentlyViewed } = useMergeRecentlyViewed();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    meta: { suppressToast: true },
    onSuccess: async (response) => {
      const userData = response.data.data;
      login(userData);

      const sessionId = localStorage.getItem('session_id');
      if (sessionId) {
        try {
          await mergeCart(sessionId);
          queryClient.invalidateQueries({ queryKey: cartKeys.current() });
        } catch (error) {
          console.error('Failed to merge cart:', error);
        }
      }

      try {
        await mergeRecentlyViewed();
      } catch {
        // recently-viewed merge is best-effort
      }

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      const role = userData.user.role;
      if (role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else if (role === 'seller') {
        navigate(ROUTES.SELLER_DASHBOARD, { replace: true });
      } else if (role === 'shipper') {
        navigate(ROUTES.SHIPPER_DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.HOME, { replace: true });
      }
    },
  });
}
