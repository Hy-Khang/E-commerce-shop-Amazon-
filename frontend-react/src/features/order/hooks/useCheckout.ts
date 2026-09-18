import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';
import { cartKeys } from '@/features/cart';
import { notificationKeys } from '@/features/notification';
import { showSuccessToast, showErrorToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { CreateOrderRequest, CheckoutResponse } from '../types/order.types';

export function useCheckout() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation<CheckoutResponse, Error, CreateOrderRequest>({
    mutationFn: (data) =>
      orderService.checkout(data).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      showSuccessToast(t('order.placed'));
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}
