import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';

export const paymentKeys = {
  all: ['payments'] as const,
  byOrder: (orderId: number) => ['payments', 'order', orderId] as const,
  byOrderAdmin: (orderId: number) =>
    ['payments', 'admin', 'order', orderId] as const,
};

interface Options {
  /** Use the privileged admin endpoint (viewer is not the order owner). */
  admin?: boolean;
  enabled?: boolean;
}

export function usePaymentsByOrder(orderId: number, options: Options = {}) {
  const { admin = false, enabled = true } = options;
  return useQuery({
    queryKey: admin
      ? paymentKeys.byOrderAdmin(orderId)
      : paymentKeys.byOrder(orderId),
    queryFn: () =>
      admin
        ? paymentService.getByOrderAdmin(orderId)
        : paymentService.getByOrder(orderId),
    staleTime: 60 * 1000,
    enabled: enabled && orderId > 0,
    select: (res) => res.data.data,
  });
}
