import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import type { RegisterFormData } from '../types/auth.types';
import { ROUTES } from '@/common/constants/routes';

export function useRegister() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: ({ confirmPassword: _, ...data }: RegisterFormData) =>
      authService.register(data),
    onSuccess: (response) => {
      login(response.data.data);
      navigate(ROUTES.HOME, { replace: true });
    },
  });
}
