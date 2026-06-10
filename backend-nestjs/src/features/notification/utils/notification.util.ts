import { Notification } from '../entities/notification.entity';
import { NotificationResponseDto } from '../dto/notification-response.dto';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipping: 'Shipping',
  delivered: 'Delivered',
  completed: 'Completed',
  return_requested: 'Return Requested',
  cancelled: 'Cancelled',
};

export function toNotificationResponse(
  entity: Notification,
): NotificationResponseDto {
  let parsedData: Record<string, unknown> | null = null;
  if (entity.data) {
    try {
      parsedData = JSON.parse(entity.data);
    } catch {
      parsedData = null;
    }
  }

  return {
    id: entity.id,
    type: entity.type,
    title: entity.title,
    message: entity.message,
    data: parsedData,
    is_read: entity.is_read,
    created_at: entity.created_at,
  };
}

export function buildOrderStatusMessage(
  orderId: number,
  oldStatus: string,
  newStatus: string,
): { title: string; message: string } {
  const newLabel = STATUS_LABELS[newStatus] || newStatus;

  if (newStatus === 'cancelled') {
    return {
      title: 'Order Cancelled',
      message: `Your order #${orderId} has been cancelled.`,
    };
  }

  if (newStatus === 'completed') {
    return {
      title: 'Order Completed',
      message: `Order #${orderId} has been completed.`,
    };
  }

  if (newStatus === 'return_requested') {
    return {
      title: 'Return Requested',
      message: `A return has been requested for order #${orderId}.`,
    };
  }

  return {
    title: 'Order Status Updated',
    message: `Your order #${orderId} has been updated to ${newLabel}.`,
  };
}
