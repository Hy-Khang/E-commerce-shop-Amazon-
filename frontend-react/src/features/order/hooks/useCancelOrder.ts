import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      orderService.cancel(id).then((res) => res.data.data),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
