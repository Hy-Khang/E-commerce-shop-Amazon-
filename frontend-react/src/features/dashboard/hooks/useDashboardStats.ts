import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  stats: () => ['admin', 'dashboard', 'stats'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getStats(),
    select: (res) => res.data.data,
    staleTime: 60_000,
  });
}
