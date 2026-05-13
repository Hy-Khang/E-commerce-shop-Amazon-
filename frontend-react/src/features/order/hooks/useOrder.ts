import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';

export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getById(id).then((res) => res.data.data),
    staleTime: 60 * 1000,
    enabled: id > 0,
  });
}
