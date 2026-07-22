import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useLogout } from './useLogout';

export function useChangePassword() {
  const { mutate: logout } = useLogout();

  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      logout();
    },
  });
}
