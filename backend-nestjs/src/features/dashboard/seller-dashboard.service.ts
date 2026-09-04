import { Injectable, Logger } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import { ShopService } from '../shop/shop.service';
import type { ISellerDashboardStats } from './types/dashboard.types';
import { resolvePeriod, type DashboardPeriod } from './utils/period.util';

@Injectable()
export class SellerDashboardService {
  private readonly logger = new Logger(SellerDashboardService.name);

  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly shopService: ShopService,
  ) {}

  async getSellerDashboard(
    userId: number,
    period?: DashboardPeriod,
  ): Promise<ISellerDashboardStats> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const shopId = shop.id;
    const { days, granularity } = resolvePeriod(period);

    const results = await Promise.allSettled([
      this.dashboardRepository.getSellerSummaryStats(shopId, days),
      this.dashboardRepository.getSellerRevenueOverTime(
        shopId,
        days,
        granularity,
      ),
      this.dashboardRepository.getSellerTopProducts(shopId, 5),
      this.dashboardRepository.getSellerRecentOrders(shopId, 10),
      this.dashboardRepository.getSellerLowStockAlerts(shopId, 10),
    ]);

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.error(
          `Seller dashboard query ${i} failed for shop ${shopId} (user ${userId}): ${result.reason}`,
        );
      }
    }

    return {
      summary: results[0].status === 'fulfilled' ? results[0].value : null,
      revenueOverTime:
        results[1].status === 'fulfilled' ? results[1].value : [],
      topProducts: results[2].status === 'fulfilled' ? results[2].value : [],
      recentOrders: results[3].status === 'fulfilled' ? results[3].value : [],
      lowStockAlerts: results[4].status === 'fulfilled' ? results[4].value : [],
    };
  }
}
