import { useQuery } from '@tanstack/react-query';
import { adminOrderService } from '../services/admin-order.service';
import { adminOrderKeys } from './useAdminOrders';

export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: adminOrderKeys.detail(id),
    queryFn: () => adminOrderService.getById(id).then((res) => res.data.data),
    staleTime: 60 * 1000,
    enabled: id > 0,
  });
}
