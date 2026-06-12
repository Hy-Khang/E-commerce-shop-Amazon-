import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationRepository } from './repositories/notification.repository';
import {
  NotificationContext,
  NotificationType,
} from './types/notification.types';
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
    const userIds = payload.notifyUserIds;
    if (!userIds || userIds.length === 0) return;

    for (const userId of userIds) {
      try {
        const isRecipientOrderOwner = userId === payload.userId;
        const context = isRecipientOrderOwner
          ? NotificationContext.Customer
          : NotificationContext.Seller;

        const { title, message } = buildOrderStatusMessage(
          payload.orderId,
          payload.oldStatus,
          payload.newStatus,
          payload.actorType,
          userId,
          payload.userId,
        );

        const data = JSON.stringify({
          orderId: payload.orderId,
          oldStatus: payload.oldStatus,
          newStatus: payload.newStatus,
          actorType: payload.actorType,
        });

        await this.notificationRepository.create({
          user_id: userId,
          type: NotificationType.ORDER_STATUS_CHANGED,
          title,
          message,
          data,
          context,
        });

        this.logger.log(
          `Notification created for user ${userId} [${context}]: order #${payload.orderId} ${payload.oldStatus} → ${payload.newStatus} (actor: ${payload.actorType})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create notification for user ${userId}, order #${payload.orderId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
