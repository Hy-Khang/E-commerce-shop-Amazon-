import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { DashboardPeriod, DashboardStats } from '../types/dashboard.types';

export const dashboardService = {
  getStats: (period?: DashboardPeriod) =>
    api.get<SuccessResponse<DashboardStats>>('/admin/dashboard', {
      params: period ? { period } : undefined,
    }),
};
