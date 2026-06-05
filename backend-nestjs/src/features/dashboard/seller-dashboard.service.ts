import { Injectable, Logger } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import type { ISellerDashboardStats } from './types/dashboard.types';

@Injectable()
export class SellerDashboardService {
  private readonly logger = new Logger(SellerDashboardService.name);

  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getSellerDashboard(sellerId: number): Promise<ISellerDashboardStats> {
    const results = await Promise.allSettled([
      this.dashboardRepository.getSellerSummaryStats(sellerId),
      this.dashboardRepository.getSellerRevenueOverTime(sellerId, 30),
      this.dashboardRepository.getSellerTopProducts(sellerId, 5),
      this.dashboardRepository.getSellerRecentOrders(sellerId, 10),
      this.dashboardRepository.getSellerLowStockAlerts(sellerId, 10),
    ]);

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.error(
          `Seller dashboard query ${i} failed for seller ${sellerId}: ${result.reason}`,
        );
      }
    }

    return {
      summary: results[0].status === 'fulfilled' ? results[0].value : null,
      revenueOverTime:
        results[1].status === 'fulfilled' ? results[1].value : [],
      topProducts: results[2].status === 'fulfilled' ? results[2].value : [],
      recentOrders: results[3].status === 'fulfilled' ? results[3].value : [],
      lowStockAlerts:
        results[4].status === 'fulfilled' ? results[4].value : [],
    };
  }
}
