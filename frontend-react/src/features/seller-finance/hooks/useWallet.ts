import { useQuery } from '@tanstack/react-query';
import { sellerFinanceService } from '../services/seller-finance.service';
import type { WithdrawalFilterParams } from '../types/seller-finance.types';

export const sellerFinanceKeys = {
  all: ['seller-finance'] as const,
  wallet: () => ['seller-finance', 'wallet'] as const,
  walletTxns: (page: number) =>
    ['seller-finance', 'wallet', 'txns', page] as const,
  myWithdrawals: (page: number) =>
    ['seller-finance', 'withdrawals', 'mine', page] as const,
  adminWithdrawals: (params: WithdrawalFilterParams) =>
    ['seller-finance', 'withdrawals', 'admin', params] as const,
  commissionSettings: () =>
    ['seller-finance', 'commission', 'settings'] as const,
  commissionRates: () => ['seller-finance', 'commission', 'rates'] as const,
};

export function useWallet(enabled = true) {
  return useQuery({
    queryKey: sellerFinanceKeys.wallet(),
    queryFn: () => sellerFinanceService.getWallet(),
    enabled,
    staleTime: 30 * 1000,
    select: (res) => res.data.data,
  });
}

export function useWalletTransactions(page: number) {
  return useQuery({
    queryKey: sellerFinanceKeys.walletTxns(page),
    queryFn: () => sellerFinanceService.getWalletTransactions({ page, limit: 20 }),
    select: (res) => res.data,
  });
}

export function useMyWithdrawals(page: number) {
  return useQuery({
    queryKey: sellerFinanceKeys.myWithdrawals(page),
    queryFn: () => sellerFinanceService.getMyWithdrawals({ page, limit: 20 }),
    select: (res) => res.data,
  });
}
