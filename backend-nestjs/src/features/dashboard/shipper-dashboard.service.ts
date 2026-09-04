import { Injectable, Logger } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import type { IShipperDashboardStats } from './types/dashboard.types';
import { resolvePeriod, type DashboardPeriod } from './utils/period.util';

@Injectable()
export class ShipperDashboardService {
  private readonly logger = new Logger(ShipperDashboardService.name);

  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getShipperDashboard(
    userId: number,
    period?: DashboardPeriod,
  ): Promise<IShipperDashboardStats> {
    const { days, granularity } = resolvePeriod(period);

    const results = await Promise.allSettled([
      this.dashboardRepository.getShipperSummaryStats(userId, days),
      this.dashboardRepository.getShipperDeliveriesOverTime(
        userId,
        days,
        granularity,
      ),
      this.dashboardRepository.getShipperRecentDeliveries(userId, 10),
    ]);

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.error(
          `Shipper dashboard query ${i} failed for user ${userId}: ${result.reason}`,
        );
      }
    }

    return {
      summary: results[0].status === 'fulfilled' ? results[0].value : null,
      deliveriesOverTime:
        results[1].status === 'fulfilled' ? results[1].value : [],
      recentDeliveries:
        results[2].status === 'fulfilled' ? results[2].value : [],
    };
  }
}
