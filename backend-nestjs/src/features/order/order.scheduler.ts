import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderRepository } from './repositories/order.repository';
import { OrderStatus } from '../../common/constants';
import { ActorType } from '../notification/types/notification.types';
import { CoinService } from '../coin/coin.service';
import { SettingsService } from '../settings/settings.service';

const AUTO_COMPLETE_DAYS = 7;

@Injectable()
export class OrderScheduler {
  private readonly logger = new Logger(OrderScheduler.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly coinService: CoinService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteDeliveredOrders(): Promise<void> {
    const cutoff = new Date(
      Date.now() - AUTO_COMPLETE_DAYS * 24 * 60 * 60 * 1000,
    );

    const orders =
      await this.orderRepository.findExpiredDeliveredOrders(cutoff);
    if (orders.length === 0) return;

    const ids = orders.map((o) => o.id);
    await this.orderRepository.bulkCompleteOrders(ids);

    // Earn Xu for each auto-completed order (best-effort, idempotent). Fetch the
    // config once for the whole batch.
    const coinConfig = await this.settingsService.getCoinConfig();

    for (const order of orders) {
      try {
        await this.coinService.awardForOrder(order, coinConfig);
      } catch (error) {
        this.logger.error(
          `Coin award failed for auto-completed order #${order.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      this.eventEmitter.emit('order.status_updated', {
        orderId: order.id,
        userId: order.user_id,
        notifyUserIds: [order.user_id],
        oldStatus: OrderStatus.Delivered,
        newStatus: OrderStatus.Completed,
        actorType: ActorType.System,
      });
    }

    this.logger.log(
      `Auto-completed ${orders.length} delivered orders older than ${AUTO_COMPLETE_DAYS} days`,
    );
  }
}
