import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type {
  DashboardPeriod,
  SellerDashboardStats,
} from '../types/dashboard.types';

export const sellerDashboardService = {
  getStats: (period?: DashboardPeriod) =>
    api.get<SuccessResponse<SellerDashboardStats>>('/seller/dashboard', {
      params: period ? { period } : undefined,
    }),
};
