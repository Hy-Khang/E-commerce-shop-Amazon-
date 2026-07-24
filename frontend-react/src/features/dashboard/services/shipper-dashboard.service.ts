import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { ShipperDashboardStats } from '../types/dashboard.types';

export const shipperDashboardService = {
  getStats: () =>
    api.get<SuccessResponse<ShipperDashboardStats>>('/shipper/dashboard'),
};
