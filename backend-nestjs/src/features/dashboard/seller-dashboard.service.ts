import { Injectable, Logger } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import { ShopService } from '../shop/shop.service';
import { CommissionService } from '../seller-finance/commission.service';
import type { ISellerDashboardStats } from './types/dashboard.types';
import { resolvePeriod, type DashboardPeriod } from './utils/period.util';

@Injectable()
export class SellerDashboardService {
  private readonly logger = new Logger(SellerDashboardService.name);

  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly shopService: ShopService,
    private readonly commissionService: CommissionService,
  ) {}

  async getSellerDashboard(
    userId: number,
    period?: DashboardPeriod,
  ): Promise<ISellerDashboardStats> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const shopId = shop.id;
    const { days, granularity } = resolvePeriod(period);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

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
      this.commissionService.getShopCommissionBreakdown(shopId, from, to),
    ]);

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.error(
          `Seller dashboard query ${i} failed for shop ${shopId} (user ${userId}): ${result.reason}`,
        );
      }
    }

    const summary = results[0].status === 'fulfilled' ? results[0].value : null;
    // Both derived from the commission ledger's own base so net = base − commission
    // is exact (rather than mixing an items-total gross with a post-discount base).
    const breakdown =
      results[5].status === 'fulfilled'
        ? results[5].value
        : { base: 0, commission: 0 };

    return {
      summary,
      revenueOverTime:
        results[1].status === 'fulfilled' ? results[1].value : [],
      topProducts: results[2].status === 'fulfilled' ? results[2].value : [],
      recentOrders: results[3].status === 'fulfilled' ? results[3].value : [],
      lowStockAlerts: results[4].status === 'fulfilled' ? results[4].value : [],
      commissionTotal: breakdown.commission,
      netRevenue: Math.max(0, breakdown.base - breakdown.commission),
    };
  }
}
