import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type {
  ShipperDashboardStats,
  DashboardPeriod,
} from '../types/dashboard.types';

export const shipperDashboardService = {
  getStats: (period?: DashboardPeriod) =>
    api.get<SuccessResponse<ShipperDashboardStats>>('/shipper/dashboard', {
      params: period ? { period } : undefined,
    }),
};
