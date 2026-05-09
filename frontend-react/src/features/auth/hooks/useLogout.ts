import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '@/common/constants/routes';

export function useLogout() {
  const navigate = useNavigate();
  const storeLogout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!refreshToken) return Promise.resolve();
      return authService.logout(refreshToken);
    },
    onSettled: () => {
      storeLogout();
      queryClient.clear();
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}
