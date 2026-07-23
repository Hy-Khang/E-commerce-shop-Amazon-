import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';

export const paymentKeys = {
  all: ['payments'] as const,
  byOrder: (orderId: number) => ['payments', 'order', orderId] as const,
};

export function usePaymentsByOrder(orderId: number, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.byOrder(orderId),
    queryFn: () => paymentService.getByOrder(orderId),
    staleTime: 60 * 1000,
    enabled: enabled && orderId > 0,
    select: (res) => res.data.data,
  });
}
