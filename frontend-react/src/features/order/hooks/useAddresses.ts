import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';

export const addressKeys = {
  list: () => ['addresses'] as const,
};

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: () => orderService.getAddresses().then((res) => res.data.data),
  });
}
