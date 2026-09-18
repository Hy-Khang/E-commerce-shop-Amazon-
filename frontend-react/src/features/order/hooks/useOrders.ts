import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import type { OrderListParams } from '../types/order.types';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: OrderListParams) => ['orders', 'list', params] as const,
  detail: (id: number) => ['orders', 'detail', id] as const,
  // Preview depends on the applied codes, cart contents, coins AND the selected
  // address (distance-based shipping) — the key must change when any of them
  // changes, or a stale estimate would be served.
  preview: (
    codes: string[],
    cartSig: string,
    coins: number,
    addressId?: number,
  ) => ['orders', 'preview', codes, cartSig, coins, addressId ?? null] as const,
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
