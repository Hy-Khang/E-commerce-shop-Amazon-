import { useQuery } from '@tanstack/react-query';
import { coinService } from '../services/coin.service';

export const coinKeys = {
  all: ['coins'] as const,
  balance: () => ['coins', 'balance'] as const,
  transactions: (page: number) => ['coins', 'transactions', page] as const,
  settings: () => ['coins', 'settings'] as const,
};

/** Current Xu balance + batches expiring soon. Refetched after any redemption. */
export function useCoinBalance(enabled = true) {
  return useQuery({
    queryKey: coinKeys.balance(),
    queryFn: () => coinService.getBalance(),
    enabled,
    staleTime: 30 * 1000,
    select: (res) => res.data.data,
  });
}
