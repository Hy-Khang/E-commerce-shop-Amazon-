import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import type { OrderListParams } from '../types/order.types';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: OrderListParams) => ['orders', 'list', params] as const,
  detail: (id: number) => ['orders', 'detail', id] as const,
};

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderService.getList(params),
    staleTime: 60 * 1000,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
