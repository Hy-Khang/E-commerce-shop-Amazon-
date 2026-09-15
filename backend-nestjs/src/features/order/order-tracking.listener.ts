import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatusHistoryRepository } from './repositories/order-status-history.repository';
import type {
  OrderStatusUpdatedEvent,
  OrderPlacedEvent,
} from '../notification/types/notification.types';

@Injectable()
export class OrderTrackingListener {
  private readonly logger = new Logger(OrderTrackingListener.name);

  constructor(private readonly historyRepo: OrderStatusHistoryRepository) {}

  @OnEvent('order.placed')
  async handleOrderPlaced(payload: OrderPlacedEvent): Promise<void> {
    try {
      await this.historyRepo.createEntry({
        orderId: payload.orderId,
        fromStatus: null,
        toStatus: 'pending',
        actorId: payload.customerId,
        actorType: 'CUSTOMER',
      });

      this.logger.log(
        `Status history created for order #${payload.orderId}: NULL → pending`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create status history for order #${payload.orderId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @OnEvent('order.status_updated')
  async handleOrderStatusUpdated(
    payload: OrderStatusUpdatedEvent,
  ): Promise<void> {
    try {
      await this.historyRepo.createEntry({
        orderId: payload.orderId,
        fromStatus: payload.oldStatus,
        toStatus: payload.newStatus,
        actorId: payload.actorId ?? null,
        actorType: payload.actorType.toUpperCase(),
      });

      this.logger.log(
        `Status history created for order #${payload.orderId}: ${payload.oldStatus} → ${payload.newStatus} (actor: ${payload.actorType})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create status history for order #${payload.orderId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
