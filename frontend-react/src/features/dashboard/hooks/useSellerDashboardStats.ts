import { useQuery } from '@tanstack/react-query';
import { sellerDashboardService } from '../services/seller-dashboard.service';

export const sellerDashboardKeys = {
  all: ['seller', 'dashboard'] as const,
  stats: () => ['seller', 'dashboard', 'stats'] as const,
};

export function useSellerDashboardStats() {
  return useQuery({
    queryKey: sellerDashboardKeys.stats(),
    queryFn: () => sellerDashboardService.getStats(),
    select: (res) => res.data.data,
    staleTime: 60_000,
  });
}
