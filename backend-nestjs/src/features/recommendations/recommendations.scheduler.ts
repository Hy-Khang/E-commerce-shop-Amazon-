import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserActivityLogRepository } from './repositories/user-activity-log.repository';

const RETENTION_DAYS = 90;

@Injectable()
export class RecommendationsScheduler {
  private readonly logger = new Logger(RecommendationsScheduler.name);

  constructor(
    private readonly activityLogRepository: UserActivityLogRepository,
  ) {}

  /** Daily cleanup: delete activity rows older than the 90-day scoring window. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldActivity(): Promise<void> {
    const count =
      await this.activityLogRepository.deleteOlderThan(RETENTION_DAYS);
    if (count > 0) {
      this.logger.log(`Deleted ${count} activity row(s) older than ${RETENTION_DAYS} days`);
    }
  }
}
