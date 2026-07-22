import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { ROUTES } from '@/common/constants/routes';

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      authService.resetPassword(data),
    onSuccess: () => {
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}
