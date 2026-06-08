import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerOrderService } from '../services/seller-order.service';
import { sellerOrderKeys } from './useSellerOrders';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { UpdatePaymentStatusRequest } from '../types/order.types';

export function useUpdateSellerPaymentStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentStatusRequest }) =>
      sellerOrderService.updatePaymentStatus(id, data).then((res) => res.data.data),

    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: sellerOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sellerOrderKeys.all });
      showSuccessToast(t((m) => m.toast.order.paymentUpdated));
    },
  });
}
