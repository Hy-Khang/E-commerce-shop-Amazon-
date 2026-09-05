import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerFinanceService } from '../services/seller-finance.service';
import { sellerFinanceKeys } from './useWallet';
import {
  showSuccessToast,
  showErrorToast,
} from '@/common/components/feedback/toast';
import type {
  Withdrawal,
  CreateWithdrawalRequest,
} from '../types/seller-finance.types';

/** Seller: request a payout (holds the amount from the wallet immediately). */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation<Withdrawal, Error, CreateWithdrawalRequest>({
    mutationFn: (data) =>
      sellerFinanceService.createWithdrawal(data).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerFinanceKeys.all });
      showSuccessToast('Withdrawal request submitted');
    },
    onError: (error) => showErrorToast(error),
  });
}
