import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderRepository } from './repositories/order.repository';
import { OrderStatus } from '../../common/constants';

const AUTO_COMPLETE_DAYS = 7;

@Injectable()
export class OrderScheduler {
  private readonly logger = new Logger(OrderScheduler.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteDeliveredOrders(): Promise<void> {
    const cutoff = new Date(
      Date.now() - AUTO_COMPLETE_DAYS * 24 * 60 * 60 * 1000,
    );

    const orders = await this.orderRepository.findExpiredDeliveredOrders(cutoff);
    if (orders.length === 0) return;

    const ids = orders.map((o) => o.id);
    await this.orderRepository.bulkCompleteOrders(ids);

    for (const order of orders) {
      this.eventEmitter.emit('order.status_updated', {
        orderId: order.id,
        userId: order.user_id,
        notifyUserIds: [order.user_id],
        oldStatus: OrderStatus.Delivered,
        newStatus: OrderStatus.Completed,
      });
    }

    this.logger.log(
      `Auto-completed ${orders.length} delivered orders older than ${AUTO_COMPLETE_DAYS} days`,
    );
  }
}
