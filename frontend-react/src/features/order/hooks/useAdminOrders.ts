import { useQuery } from '@tanstack/react-query';
import { adminOrderService } from '../services/admin-order.service';
import type { AdminOrderListParams } from '../types/order.types';

export const adminOrderKeys = {
  all: ['admin', 'orders'] as const,
  list: (params: AdminOrderListParams) => ['admin', 'orders', 'list', params] as const,
  detail: (id: number) => ['admin', 'orders', 'detail', id] as const,
};

export function useAdminOrders(
  params: AdminOrderListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => adminOrderService.getList(params),
    enabled: options?.enabled,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
