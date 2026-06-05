import { Injectable, Logger } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import type { IDashboardStats } from './types/dashboard.types';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getDashboard(): Promise<IDashboardStats> {
    const results = await Promise.allSettled([
      this.dashboardRepository.getSummaryStats(),
      this.dashboardRepository.getRevenueOverTime(30),
      this.dashboardRepository.getOrdersByStatus(),
      this.dashboardRepository.getRecentOrders(10),
      this.dashboardRepository.getUsersByRole(),
      this.dashboardRepository.getTopProducts(5),
      this.dashboardRepository.getLowStockAlerts(10),
    ]);

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.error(`Dashboard query ${i} failed: ${result.reason}`);
      }
    }

    return {
      summary:
        results[0].status === 'fulfilled' ? results[0].value : null,
      revenueOverTime:
        results[1].status === 'fulfilled' ? results[1].value : [],
      ordersByStatus:
        results[2].status === 'fulfilled' ? results[2].value : [],
      recentOrders:
        results[3].status === 'fulfilled' ? results[3].value : [],
      usersByRole:
        results[4].status === 'fulfilled' ? results[4].value : [],
      topProducts:
        results[5].status === 'fulfilled' ? results[5].value : [],
      lowStockAlerts:
        results[6].status === 'fulfilled' ? results[6].value : [],
    };
  }
}
