import { useQuery } from '@tanstack/react-query';
import { sellerOrderService } from '../services/seller-order.service';
import { sellerOrderKeys } from './useSellerOrders';

export function useSellerOrder(id: number) {
  return useQuery({
    queryKey: sellerOrderKeys.detail(id),
    queryFn: () => sellerOrderService.getById(id).then((res) => res.data.data),
    staleTime: 60 * 1000,
    enabled: id > 0,
  });
}
