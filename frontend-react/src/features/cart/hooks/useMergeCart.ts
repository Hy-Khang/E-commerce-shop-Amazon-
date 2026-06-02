import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { cartKeys } from './useCart';

export function useMergeCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      cartService.merge({ session_id: sessionId }).then((res) => res.data.data),
    // Merge failure is non-blocking: caught silently in useLogin/useRegister try/catch.
    // User can re-add items manually if merge fails.
    meta: { suppressToast: true },
    onSuccess: () => {
      localStorage.removeItem('session_id');
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}
