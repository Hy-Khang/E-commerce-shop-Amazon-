import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationType } from './types/notification.types';
import type { OrderStatusUpdatedEvent } from './types/notification.types';
import { buildOrderStatusMessage } from './utils/notification.util';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @OnEvent('order.status_updated')
  async handleOrderStatusUpdated(
    payload: OrderStatusUpdatedEvent,
  ): Promise<void> {
    try {
      const { title, message } = buildOrderStatusMessage(
        payload.orderId,
        payload.oldStatus,
        payload.newStatus,
      );

      await this.notificationRepository.create({
        user_id: payload.userId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title,
        message,
        data: JSON.stringify({
          orderId: payload.orderId,
          oldStatus: payload.oldStatus,
          newStatus: payload.newStatus,
        }),
      });

      this.logger.log(
        `Notification created for user ${payload.userId}: order #${payload.orderId} ${payload.oldStatus} → ${payload.newStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notification for order #${payload.orderId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
