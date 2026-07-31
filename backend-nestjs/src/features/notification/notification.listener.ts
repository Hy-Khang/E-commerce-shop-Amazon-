import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import {
  NotificationContext,
  NotificationType,
} from './types/notification.types';
import type {
  OrderStatusUpdatedEvent,
  OrderPlacedEvent,
} from './types/notification.types';
import {
  buildOrderStatusMessage,
  buildNewOrderMessage,
} from './utils/notification.util';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('order.placed')
  async handleOrderPlaced(payload: OrderPlacedEvent): Promise<void> {
    for (const sellerUserId of payload.sellerUserIds) {
      try {
        const { title, message } = buildNewOrderMessage(
          payload.orderId,
          payload.totalAmount,
          payload.itemCount,
        );

        await this.notificationService.createNotification({
          user_id: sellerUserId,
          type: NotificationType.NEW_ORDER,
          title,
          message,
          data: JSON.stringify({
            orderId: payload.orderId,
            totalAmount: payload.totalAmount,
            itemCount: payload.itemCount,
          }),
          context: NotificationContext.Seller,
        });

        this.logger.log(
          `New order notification created for seller ${sellerUserId}: order #${payload.orderId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create new order notification for seller ${sellerUserId}, order #${payload.orderId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

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

        await this.notificationService.createNotification({
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
