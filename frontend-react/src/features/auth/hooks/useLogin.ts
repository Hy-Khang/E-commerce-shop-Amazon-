import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import type { LoginRequest } from '../types/auth.types';
import { ROUTES } from '@/common/constants/routes';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      login(response.data.data);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.HOME;
      navigate(from, { replace: true });
    },
  });
}
