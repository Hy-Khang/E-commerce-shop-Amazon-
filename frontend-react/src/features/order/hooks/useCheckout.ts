import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';
import { cartKeys } from '@/features/cart';
import type { CreateOrderRequest } from '../types/order.types';

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) =>
      orderService.checkout(data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
