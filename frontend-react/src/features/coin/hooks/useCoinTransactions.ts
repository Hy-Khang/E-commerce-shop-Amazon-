import { useQuery } from '@tanstack/react-query';
import { coinService } from '../services/coin.service';
import { coinKeys } from './useCoinBalance';

/** Paginated Xu ledger (newest first). */
export function useCoinTransactions(page: number, limit = 20) {
  return useQuery({
    queryKey: coinKeys.transactions(page),
    queryFn: () => coinService.getTransactions({ page, limit }),
    staleTime: 60 * 1000,
    select: (res) => ({ data: res.data.data, meta: res.data.meta }),
  });
}
