import { useQuery } from '@tanstack/react-query';
import { sellerOrderService } from '../services/seller-order.service';
import type { SellerOrderListParams } from '../types/order.types';

export const sellerOrderKeys = {
  all: ['seller', 'orders'] as const,
  list: (params: SellerOrderListParams) => ['seller', 'orders', 'list', params] as const,
  detail: (id: number) => ['seller', 'orders', 'detail', id] as const,
};

export function useSellerOrders(
  params: SellerOrderListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: sellerOrderKeys.list(params),
    queryFn: () => sellerOrderService.getList(params),
    enabled: options?.enabled,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
