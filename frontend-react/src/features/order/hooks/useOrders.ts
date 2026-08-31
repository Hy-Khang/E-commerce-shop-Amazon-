import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import type { OrderListParams } from '../types/order.types';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: OrderListParams) => ['orders', 'list', params] as const,
  detail: (id: number) => ['orders', 'detail', id] as const,
  // Preview depends on both the applied codes AND the cart contents — the key
  // must change when either changes, or a stale estimate would be served.
  preview: (codes: string[], cartSig: string, coins: number) =>
    ['orders', 'preview', codes, cartSig, coins] as const,
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
