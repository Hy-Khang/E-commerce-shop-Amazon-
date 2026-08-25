import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardPeriod } from '../types/dashboard.types';

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  stats: (period: DashboardPeriod) =>
    ['admin', 'dashboard', 'stats', period] as const,
};

export function useDashboardStats(period: DashboardPeriod) {
  return useQuery({
    queryKey: dashboardKeys.stats(period),
    queryFn: () => dashboardService.getStats(period),
    select: (res) => res.data.data,
    staleTime: 60_000,
  });
}
