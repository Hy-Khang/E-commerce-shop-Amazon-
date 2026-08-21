import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '@/common/constants/routes';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useLogout() {
  const navigate = useNavigate();
  const storeLogout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async () => {
      if (!refreshToken) return;
      await authService.logout(refreshToken);
    },
    meta: { suppressToast: true },
    onSettled: () => {
      storeLogout();
      queryClient.clear();
      showSuccessToast(t((m) => m.toast.auth.loggedOut));
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}
