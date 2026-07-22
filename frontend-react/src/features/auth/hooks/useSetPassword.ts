import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useLogout } from './useLogout';

export function useSetPassword() {
  const { mutate: logout } = useLogout();

  return useMutation({
    mutationFn: (data: { new_password: string }) =>
      authService.setPassword(data),
    onSuccess: () => {
      logout();
    },
  });
}
