import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';

export function useOrderGroup(groupId: string | null) {
  return useQuery({
    queryKey: [...orderKeys.all, 'group', groupId] as const,
    queryFn: () => orderService.getByGroupId(groupId!).then((res) => res.data.data),
    staleTime: 60 * 1000,
    enabled: !!groupId,
  });
}
