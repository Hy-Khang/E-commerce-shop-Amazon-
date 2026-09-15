import { api } from '@/core/api/axios-instance';
import type {
  SuccessResponse,
  PaginatedResponse,
} from '@/core/api/api.types';
import type { PaginationParams } from '@/common/types/common.types';
import type {
  WalletBalance,
  WalletTransaction,
  Withdrawal,
  CreateWithdrawalRequest,
  CommissionSettings,
  UpdateCommissionSettingsRequest,
  CommissionCategoryRate,
  WithdrawalFilterParams,
} from '../types/seller-finance.types';

export const sellerFinanceService = {
  // ─── Seller wallet ───
  getWallet: () =>
    api.get<SuccessResponse<WalletBalance>>('/seller/wallet'),

  getWalletTransactions: (params: PaginationParams) =>
    api.get<PaginatedResponse<WalletTransaction>>(
      '/seller/wallet/transactions',
      { params },
    ),

  createWithdrawal: (data: CreateWithdrawalRequest) =>
    api.post<SuccessResponse<Withdrawal>>('/seller/withdrawals', data),

  getMyWithdrawals: (params: PaginationParams) =>
    api.get<PaginatedResponse<Withdrawal>>('/seller/withdrawals', { params }),

  // ─── Admin withdrawals ───
  getWithdrawals: (params: WithdrawalFilterParams) =>
    api.get<PaginatedResponse<Withdrawal>>('/admin/withdrawals', { params }),

  approveWithdrawal: (id: number) =>
    api.patch<SuccessResponse<Withdrawal>>(`/admin/withdrawals/${id}/approve`),

  rejectWithdrawal: (id: number, reject_reason?: string) =>
    api.patch<SuccessResponse<Withdrawal>>(`/admin/withdrawals/${id}/reject`, {
      reject_reason,
    }),

  // ─── Admin commission config ───
  getCommissionSettings: () =>
    api.get<SuccessResponse<CommissionSettings>>(
      '/admin/settings/commission',
    ),

  updateCommissionSettings: (data: UpdateCommissionSettingsRequest) =>
    api.patch<SuccessResponse<CommissionSettings>>(
      '/admin/settings/commission',
      data,
    ),

  getCommissionCategoryRates: () =>
    api.get<SuccessResponse<CommissionCategoryRate[]>>(
      '/admin/settings/commission/category-rates',
    ),

  upsertCommissionCategoryRate: (categoryId: number, rate_percent: number) =>
    api.put<SuccessResponse<CommissionCategoryRate>>(
      `/admin/settings/commission/category-rates/${categoryId}`,
      { rate_percent },
    ),

  deleteCommissionCategoryRate: (categoryId: number) =>
    api.delete(`/admin/settings/commission/category-rates/${categoryId}`),
};
