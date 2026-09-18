import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';
import { notificationKeys } from '@/features/notification';
import { showSuccessToast, showErrorToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';

export function useRequestReturn() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) =>
      orderService.requestReturn(id).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      showSuccessToast(t('order.returnRequested'));
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}
