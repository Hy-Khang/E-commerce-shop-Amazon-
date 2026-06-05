import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { SellerDashboardStats } from '../types/dashboard.types';

export const sellerDashboardService = {
  getStats: () =>
    api.get<SuccessResponse<SellerDashboardStats>>('/seller/dashboard'),
};
