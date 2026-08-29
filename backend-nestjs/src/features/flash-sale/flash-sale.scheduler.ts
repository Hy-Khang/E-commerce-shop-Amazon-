import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FlashSaleRepository } from './repositories/flash-sale.repository';

@Injectable()
export class FlashSaleScheduler {
  private readonly logger = new Logger(FlashSaleScheduler.name);

  constructor(private readonly flashSaleRepository: FlashSaleRepository) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async transitionCampaignStatuses(): Promise<void> {
    const now = new Date();
    const ended = await this.flashSaleRepository.endDue(now);
    const activated = await this.flashSaleRepository.activateDue(now);

    if (activated > 0 || ended > 0) {
      this.logger.log(
        `Flash sale status cron: ${activated} activated, ${ended} ended`,
      );
    }
  }
}
