import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoinService } from './coin.service';

@Injectable()
export class CoinScheduler {
  private readonly logger = new Logger(CoinScheduler.name);

  constructor(private readonly coinService: CoinService) {}

  /** Daily sweep: mark past-expiry active batches `expired` + ledger entries. */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async expireCoinBatches(): Promise<void> {
    const count = await this.coinService.expireBatches();
    if (count > 0) {
      this.logger.log(`Expired ${count} coin batch(es)`);
    }
  }
}
