import { Injectable, Logger } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import type { IShipperDashboardStats } from './types/dashboard.types';

@Injectable()
export class ShipperDashboardService {
  private readonly logger = new Logger(ShipperDashboardService.name);

  constructor(
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getShipperDashboard(userId: number): Promise<IShipperDashboardStats> {
    const results = await Promise.allSettled([
      this.dashboardRepository.getShipperSummaryStats(userId),
      this.dashboardRepository.getShipperDeliveriesOverTime(userId, 30),
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
