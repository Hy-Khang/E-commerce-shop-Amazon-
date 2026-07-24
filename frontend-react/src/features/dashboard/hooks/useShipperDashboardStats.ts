import { useQuery } from '@tanstack/react-query';
import { shipperDashboardService } from '../services/shipper-dashboard.service';

export const shipperDashboardKeys = {
  all: ['shipper', 'dashboard'] as const,
  stats: () => ['shipper', 'dashboard', 'stats'] as const,
};

export function useShipperDashboardStats() {
  return useQuery({
    queryKey: shipperDashboardKeys.stats(),
    queryFn: () => shipperDashboardService.getStats(),
    select: (res) => res.data.data,
    staleTime: 60_000,
  });
}
