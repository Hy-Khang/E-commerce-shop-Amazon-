import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sellerFinanceService } from '../services/seller-finance.service';
import { sellerFinanceKeys } from './useWallet';
import {
  showSuccessToast,
  showErrorToast,
} from '@/common/components/feedback/toast';
import type {
  CommissionSettings,
  UpdateCommissionSettingsRequest,
  CommissionCategoryRate,
} from '../types/seller-finance.types';

export function useCommissionSettings() {
  return useQuery({
    queryKey: sellerFinanceKeys.commissionSettings(),
    queryFn: () => sellerFinanceService.getCommissionSettings(),
    select: (res) => res.data.data,
  });
}

export function useUpdateCommissionSettings() {
  const queryClient = useQueryClient();
  return useMutation<
    CommissionSettings,
    Error,
    UpdateCommissionSettingsRequest
  >({
    mutationFn: (data) =>
      sellerFinanceService
        .updateCommissionSettings(data)
        .then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerFinanceKeys.commissionSettings(),
      });
      showSuccessToast('Commission settings updated');
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useCommissionCategoryRates() {
  return useQuery({
    queryKey: sellerFinanceKeys.commissionRates(),
    queryFn: () => sellerFinanceService.getCommissionCategoryRates(),
    select: (res) => res.data.data,
  });
}

export function useUpsertCommissionCategoryRate() {
  const queryClient = useQueryClient();
  return useMutation<
    CommissionCategoryRate,
    Error,
    { categoryId: number; rate_percent: number }
  >({
    mutationFn: ({ categoryId, rate_percent }) =>
      sellerFinanceService
        .upsertCommissionCategoryRate(categoryId, rate_percent)
        .then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerFinanceKeys.commissionRates(),
      });
      showSuccessToast('Category commission rate saved');
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useDeleteCommissionCategoryRate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (categoryId) =>
      sellerFinanceService
        .deleteCommissionCategoryRate(categoryId)
        .then(() => undefined),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerFinanceKeys.commissionRates(),
      });
      showSuccessToast('Category commission rate removed');
    },
    onError: (error) => showErrorToast(error),
  });
}
