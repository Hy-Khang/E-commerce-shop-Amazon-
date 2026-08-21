import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderTrackingService } from '../services/order-tracking.service';
import type { OrderStatus } from '../types/order.types';
import type { UpdateShipperLocationRequest } from '../types/order-tracking.types';
import { shipperOrderKeys } from './useShipperOrders';

export const trackingKeys = {
  customer: (orderId: number) => ['order-tracking', 'customer', orderId] as const,
  admin: (orderId: number) => ['order-tracking', 'admin', orderId] as const,
  seller: (orderId: number) => ['order-tracking', 'seller', orderId] as const,
  shipper: (orderId: number) => ['order-tracking', 'shipper', orderId] as const,
};

export function useOrderTracking(orderId: number, orderStatus?: OrderStatus) {
  return useQuery({
    queryKey: trackingKeys.customer(orderId),
    queryFn: () => orderTrackingService.getCustomerTracking(orderId).then((res) => res.data.data),
    staleTime: 60_000,
    refetchInterval: orderStatus === 'shipping' ? 10_000 : false,
    enabled: orderId > 0,
  });
}

export function useAdminOrderTracking(orderId: number) {
  return useQuery({
    queryKey: trackingKeys.admin(orderId),
    queryFn: () => orderTrackingService.getAdminTracking(orderId).then((res) => res.data.data),
    staleTime: 60_000,
    enabled: orderId > 0,
  });
}

export function useSellerOrderTracking(orderId: number) {
  return useQuery({
    queryKey: trackingKeys.seller(orderId),
    queryFn: () => orderTrackingService.getSellerTracking(orderId).then((res) => res.data.data),
    staleTime: 60_000,
    enabled: orderId > 0,
  });
}

export function useShipperOrderTracking(orderId: number, orderStatus?: OrderStatus) {
  return useQuery({
    queryKey: trackingKeys.shipper(orderId),
    queryFn: () => orderTrackingService.getShipperTracking(orderId).then((res) => res.data.data),
    staleTime: 60_000,
    refetchInterval: orderStatus === 'shipping' ? 10_000 : false,
    enabled: orderId > 0,
  });
}

export function useUpdateShipperLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: UpdateShipperLocationRequest }) =>
      orderTrackingService.updateShipperLocation(orderId, data),
    onSuccess: (_res, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.shipper(orderId) });
      queryClient.invalidateQueries({ queryKey: shipperOrderKeys.detail(orderId) });
    },
  });
}
