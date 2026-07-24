import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipperOrderService } from '../services/shipper-order.service';
import { shipperOrderKeys } from './useShipperOrders';
import { shipperDashboardKeys } from '../../dashboard/hooks/useShipperDashboardStats';
import { showSuccessToast, showErrorToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import { ApiError } from '@/core/api/api.types';

export function useAcceptOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) =>
      shipperOrderService.acceptOrder(id).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipperOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: shipperDashboardKeys.all });
      showSuccessToast(t((m) => m.toast.order.accepted));
    },

    onError: (error: Error) => {
      if (error instanceof ApiError && error.code === 'ORDER_003') {
        showErrorToast('This order has already been accepted by another shipper');
      } else {
        showErrorToast(t((m) => m.toast.error.generic));
      }
    },
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) =>
      shipperOrderService.markDelivered(id).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipperOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: shipperDashboardKeys.all });
      showSuccessToast(t((m) => m.toast.order.delivered));
    },

    onError: () => {
      showErrorToast(t((m) => m.toast.error.generic));
    },
  });
}
