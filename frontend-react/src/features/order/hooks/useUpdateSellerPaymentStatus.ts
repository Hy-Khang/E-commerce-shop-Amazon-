import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerOrderService } from '../services/seller-order.service';
import { sellerOrderKeys } from './useSellerOrders';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { UpdatePaymentStatusRequest } from '../types/order.types';

export function useUpdateSellerPaymentStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentStatusRequest }) =>
      sellerOrderService.updatePaymentStatus(id, data).then((res) => res.data.data),

    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: sellerOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sellerOrderKeys.all });
      showSuccessToast(t('order.paymentUpdated'));
    },
  });
}
