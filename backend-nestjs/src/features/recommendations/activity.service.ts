import { Injectable, Logger } from '@nestjs/common';
import { UserActivityLogRepository } from './repositories/user-activity-log.repository';
import { RecordActivityDto } from './dto/record-activity.dto';
import {
  ActivityAction,
  RecommendationOwner,
} from './types/recommendations.types';

/**
 * Write path for behavioral signals. Deliberately lenient — analytics signal,
 * never blocks UX. All failures are logged and swallowed.
 */
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly activityLogRepository: UserActivityLogRepository,
  ) {}

  /** Record one frontend-reported activity. No identity → silent no-op. */
  async record(
    owner: RecommendationOwner | null,
    dto: RecordActivityDto,
  ): Promise<void> {
    if (!owner) return;
    try {
      await this.activityLogRepository.record({
        userId: owner.userId,
        sessionId: owner.sessionId,
        action: dto.action,
        targetType: dto.target_type,
        targetId: dto.target_id ?? null,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to record activity (${dto.action}): ${(err as Error).message}`,
      );
    }
  }

  /** Record a PURCHASE for a resolved product id (from the order.created listener). */
  async recordPurchase(userId: number, productId: number): Promise<void> {
    try {
      await this.activityLogRepository.record({
        userId,
        sessionId: null,
        action: ActivityAction.Purchase,
        targetType: 'product',
        targetId: productId,
        metadata: null,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to record PURCHASE for product ${productId}: ${(err as Error).message}`,
      );
    }
  }
}
