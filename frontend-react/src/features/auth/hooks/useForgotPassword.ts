import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { ForgotPasswordRequest } from '../types/auth.types';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data),
    meta: { suppressToast: true },
  });
}
