import { useQuery } from '@tanstack/react-query';
import { coinService } from '../services/coin.service';
import { coinKeys } from './useCoinBalance';

/** Admin: read the coin feature config. */
export function useCoinSettings() {
  return useQuery({
    queryKey: coinKeys.settings(),
    queryFn: () => coinService.getSettings(),
    staleTime: 60 * 1000,
    select: (res) => res.data.data,
  });
}
