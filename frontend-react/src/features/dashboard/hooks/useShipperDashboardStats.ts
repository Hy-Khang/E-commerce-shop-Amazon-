import { useQuery } from '@tanstack/react-query';
import { shipperDashboardService } from '../services/shipper-dashboard.service';
import type { DashboardPeriod } from '../types/dashboard.types';

export const shipperDashboardKeys = {
  all: ['shipper', 'dashboard'] as const,
  stats: (period: DashboardPeriod) =>
    ['shipper', 'dashboard', 'stats', period] as const,
};

export function useShipperDashboardStats(period: DashboardPeriod) {
  return useQuery({
    queryKey: shipperDashboardKeys.stats(period),
    queryFn: () => shipperDashboardService.getStats(period),
    select: (res) => res.data.data,
    staleTime: 60_000,
  });
}
