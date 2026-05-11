import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { cartKeys } from './useCart';
import type { Cart } from '../types/cart.types';
import { useCartStore } from '../stores/cart.store';

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);

  return useMutation({
    mutationFn: (id: number) => cartService.removeItem(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.current() });
      const previous = queryClient.getQueryData<Cart>(cartKeys.current());

      if (previous) {
        const updatedItems = previous.items.filter((item) => item.id !== id);
        queryClient.setQueryData(cartKeys.current(), { ...previous, items: updatedItems });

        const count = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        setItemCount(count);
      }

      return { previous };
    },

    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.current(), context.previous);
        const count = context.previous.items.reduce((sum, item) => sum + item.quantity, 0);
        setItemCount(count);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}
