import { Injectable, Logger } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import type { IDashboardStats } from './types/dashboard.types';
import { resolvePeriod, type DashboardPeriod } from './utils/period.util';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getDashboard(period?: DashboardPeriod): Promise<IDashboardStats> {
    const { days, granularity } = resolvePeriod(period);

    const results = await Promise.allSettled([
      this.dashboardRepository.getSummaryStats(days),
      this.dashboardRepository.getRevenueOverTime(days, granularity),
      this.dashboardRepository.getOrdersByStatus(),
      this.dashboardRepository.getRecentOrders(10),
      this.dashboardRepository.getUsersByRole(),
      this.dashboardRepository.getTopProducts(5),
      this.dashboardRepository.getLowStockAlerts(10),
      this.dashboardRepository.getAttentionSignals(),
      this.dashboardRepository.getTopShops(5),
    ]);

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.error(`Dashboard query ${i} failed: ${result.reason}`);
      }
    }

    return {
      summary: results[0].status === 'fulfilled' ? results[0].value : null,
      revenueOverTime:
        results[1].status === 'fulfilled' ? results[1].value : [],
      ordersByStatus: results[2].status === 'fulfilled' ? results[2].value : [],
      recentOrders: results[3].status === 'fulfilled' ? results[3].value : [],
      usersByRole: results[4].status === 'fulfilled' ? results[4].value : [],
      topProducts: results[5].status === 'fulfilled' ? results[5].value : [],
      lowStockAlerts: results[6].status === 'fulfilled' ? results[6].value : [],
      attentionSignals:
        results[7].status === 'fulfilled' ? results[7].value : null,
      topShops: results[8].status === 'fulfilled' ? results[8].value : [],
    };
  }
}
