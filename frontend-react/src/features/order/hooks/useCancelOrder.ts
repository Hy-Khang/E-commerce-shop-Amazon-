import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';
import { notificationKeys } from '@/features/notification';
import { showSuccessToast, showErrorToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) =>
      orderService.cancel(id).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      showSuccessToast(t((m) => m.toast.order.cancelled));
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}
