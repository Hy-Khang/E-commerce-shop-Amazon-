import { useQuery } from '@tanstack/react-query';
import { shipperOrderService } from '../services/shipper-order.service';
import type { ShipperOrderListParams } from '../types/order.types';

export const shipperOrderKeys = {
  all: ['shipper', 'orders'] as const,
  list: (params: ShipperOrderListParams) => ['shipper', 'orders', 'list', params] as const,
  detail: (id: number) => ['shipper', 'orders', 'detail', id] as const,
};

export function useShipperOrders(params: ShipperOrderListParams) {
  return useQuery({
    queryKey: shipperOrderKeys.list(params),
    queryFn: () => shipperOrderService.getList(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}

export function useShipperOrder(id: number) {
  return useQuery({
    queryKey: shipperOrderKeys.detail(id),
    queryFn: () => shipperOrderService.getById(id).then((res) => res.data.data),
    staleTime: 60_000,
    enabled: id > 0,
  });
}
