import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { cartKeys } from './useCart';

export function useMergeCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      cartService.merge({ session_id: sessionId }).then((res) => res.data.data),

    onSuccess: () => {
      localStorage.removeItem('session_id');
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}
