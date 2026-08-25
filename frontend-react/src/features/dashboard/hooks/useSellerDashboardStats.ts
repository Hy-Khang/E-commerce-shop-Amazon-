import { useQuery } from '@tanstack/react-query';
import { sellerDashboardService } from '../services/seller-dashboard.service';
import type { DashboardPeriod } from '../types/dashboard.types';

export const sellerDashboardKeys = {
  all: ['seller', 'dashboard'] as const,
  stats: (period: DashboardPeriod) =>
    ['seller', 'dashboard', 'stats', period] as const,
};

export function useSellerDashboardStats(period: DashboardPeriod) {
  return useQuery({
    queryKey: sellerDashboardKeys.stats(period),
    queryFn: () => sellerDashboardService.getStats(period),
    select: (res) => res.data.data,
    staleTime: 60_000,
  });
}
