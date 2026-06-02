import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { cartKeys } from './useCart';
import type { Cart, AddToCartRequest } from '../types/cart.types';
import { useCartStore } from '../stores/cart.store';
import { showErrorToast, showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useAddToCart() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: AddToCartRequest) =>
      cartService.addItem(data).then((res) => res.data.data),
    meta: { suppressToast: true },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.current() });
      const previous = queryClient.getQueryData<Cart>(cartKeys.current());

      if (previous) {
        const existingIndex = previous.items.findIndex(
          (item) => item.product_variant_id === newItem.product_variant_id,
        );

        let updatedItems;
        if (existingIndex >= 0) {
          updatedItems = previous.items.map((item, i) =>
            i === existingIndex
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item,
          );
        } else {
          updatedItems = previous.items;
        }

        const optimistic = { ...previous, items: updatedItems };
        queryClient.setQueryData(cartKeys.current(), optimistic);

        const count = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        setItemCount(count);
      }

      return { previous };
    },

    onSuccess: () => {
      showSuccessToast(t((m) => m.toast.cart.added), 'cart-success');
    },

    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.current(), context.previous);
        const count = context.previous.items.reduce((sum, item) => sum + item.quantity, 0);
        setItemCount(count);
      }
      showErrorToast(err, undefined, 'cart-error');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}
