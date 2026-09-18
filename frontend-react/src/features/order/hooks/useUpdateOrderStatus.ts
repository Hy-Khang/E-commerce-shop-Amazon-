import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrderService } from '../services/admin-order.service';
import { adminOrderKeys } from './useAdminOrders';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { UpdateOrderStatusRequest } from '../types/order.types';

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusRequest }) =>
      adminOrderService.updateStatus(id, data).then((res) => res.data.data),

    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      showSuccessToast(t('order.statusUpdated'));
    },
  });
}
