import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import type { RegisterFormData } from '../types/auth.types';
import { ROUTES } from '@/common/constants/routes';

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ confirmPassword: _, ...data }: RegisterFormData) =>
      authService.register(data),
    meta: { suppressToast: true },
    onSuccess: (response) => {
      const { email } = response.data.data;
      navigate(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`, { replace: true });
    },
  });
}
