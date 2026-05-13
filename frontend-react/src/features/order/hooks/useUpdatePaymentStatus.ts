import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrderService } from '../services/admin-order.service';
import { adminOrderKeys } from './useAdminOrders';
import type { UpdatePaymentStatusRequest } from '../types/order.types';

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentStatusRequest }) =>
      adminOrderService.updatePaymentStatus(id, data).then((res) => res.data.data),

    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
    },
  });
}
