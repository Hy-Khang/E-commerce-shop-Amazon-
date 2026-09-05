import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sellerFinanceService } from '../services/seller-finance.service';
import { sellerFinanceKeys } from './useWallet';
import {
  showSuccessToast,
  showErrorToast,
} from '@/common/components/feedback/toast';
import type {
  Withdrawal,
  WithdrawalFilterParams,
} from '../types/seller-finance.types';

export function useAdminWithdrawals(params: WithdrawalFilterParams) {
  return useQuery({
    queryKey: sellerFinanceKeys.adminWithdrawals(params),
    queryFn: () => sellerFinanceService.getWithdrawals(params),
    select: (res) => res.data,
  });
}

export function useApproveWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation<Withdrawal, Error, number>({
    mutationFn: (id) =>
      sellerFinanceService.approveWithdrawal(id).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerFinanceKeys.all });
      showSuccessToast('Withdrawal request approved');
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useRejectWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation<
    Withdrawal,
    Error,
    { id: number; reject_reason?: string }
  >({
    mutationFn: ({ id, reject_reason }) =>
      sellerFinanceService
        .rejectWithdrawal(id, reject_reason)
        .then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerFinanceKeys.all });
      showSuccessToast('Rejected and refunded to the seller wallet');
    },
    onError: (error) => showErrorToast(error),
  });
}
