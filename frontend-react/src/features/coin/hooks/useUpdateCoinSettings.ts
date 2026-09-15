import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coinService } from '../services/coin.service';
import { coinKeys } from './useCoinBalance';
import {
  showSuccessToast,
  showErrorToast,
} from '@/common/components/feedback/toast';
import type {
  CoinSettings,
  UpdateCoinSettingsRequest,
} from '../types/coin.types';

/** Admin: update the coin config. */
export function useUpdateCoinSettings() {
  const queryClient = useQueryClient();

  return useMutation<CoinSettings, Error, UpdateCoinSettingsRequest>({
    mutationFn: (data) =>
      coinService.updateSettings(data).then((res) => res.data.data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.settings() });
      showSuccessToast('Coin settings updated');
    },
    onError: (error) => showErrorToast(error),
  });
}
