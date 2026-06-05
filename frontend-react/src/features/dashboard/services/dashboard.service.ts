import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { DashboardStats } from '../types/dashboard.types';

export const dashboardService = {
  getStats: () =>
    api.get<SuccessResponse<DashboardStats>>('/admin/dashboard'),
};
