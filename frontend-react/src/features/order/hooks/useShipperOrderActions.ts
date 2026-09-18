import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipperOrderService } from '../services/shipper-order.service';
import { shipperOrderKeys } from './useShipperOrders';
import { shipperDashboardKeys } from '../../dashboard/hooks/useShipperDashboardStats';
import { showSuccessToast, showErrorToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/core/api/api.types';

export function useAcceptOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) =>
      shipperOrderService.acceptOrder(id).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipperOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: shipperDashboardKeys.all });
      showSuccessToast(t('order.accepted'));
    },

    onError: (error: Error) => {
      if (error instanceof ApiError && error.code === 'ORDER_003') {
        showErrorToast('This order has already been accepted by another shipper');
      } else {
        showErrorToast(t('error.generic'));
      }
    },
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) =>
      shipperOrderService.markDelivered(id).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipperOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: shipperDashboardKeys.all });
      showSuccessToast(t('order.delivered'));
    },

    onError: () => {
      showErrorToast(t('error.generic'));
    },
  });
}
