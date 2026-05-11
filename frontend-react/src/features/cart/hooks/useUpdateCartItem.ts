import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { cartKeys } from './useCart';
import type { Cart } from '../types/cart.types';
import { useCartStore } from '../stores/cart.store';

interface UpdateCartItemParams {
  id: number;
  quantity: number;
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);

  return useMutation({
    mutationFn: ({ id, quantity }: UpdateCartItemParams) =>
      cartService.updateItem(id, { quantity }).then((res) => res.data.data),

    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.current() });
      const previous = queryClient.getQueryData<Cart>(cartKeys.current());

      if (previous) {
        const updatedItems = previous.items.map((item) =>
          item.id === id ? { ...item, quantity } : item,
        );
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
