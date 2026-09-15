import { api } from '@/core/api/axios-instance';
import type {
  SuccessResponse,
  PaginatedResponse,
} from '@/core/api/api.types';
import type { PaginationParams } from '@/common/types/common.types';
import type {
  CoinBalance,
  CoinTransaction,
  CoinSettings,
  UpdateCoinSettingsRequest,
} from '../types/coin.types';

export const coinService = {
  getBalance: () =>
    api.get<SuccessResponse<CoinBalance>>('/coins/balance'),

  getTransactions: (params: PaginationParams) =>
    api.get<PaginatedResponse<CoinTransaction>>('/coins/transactions', {
      params,
    }),

  // Admin — coin config
  getSettings: () =>
    api.get<SuccessResponse<CoinSettings>>('/admin/settings/coins'),

  updateSettings: (data: UpdateCoinSettingsRequest) =>
    api.patch<SuccessResponse<CoinSettings>>('/admin/settings/coins', data),
};
