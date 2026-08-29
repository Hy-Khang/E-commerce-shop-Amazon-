import { Notification } from '../entities/notification.entity';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { ActorType } from '../types/notification.types';

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
  actorType: ActorType,
  recipientUserId: number,
  orderOwnerUserId: number,
): { title: string; message: string } {
  const isRecipientOrderOwner = recipientUserId === orderOwnerUserId;

  if (isRecipientOrderOwner) {
    return buildCustomerMessage(orderId, newStatus, actorType);
  }

  return buildSellerMessage(orderId, newStatus, actorType);
}

function buildCustomerMessage(
  orderId: number,
  newStatus: string,
  actorType: ActorType,
): { title: string; message: string } {
  const newLabel = STATUS_LABELS[newStatus] || newStatus;

  if (newStatus === 'cancelled') {
    return {
      title: 'Order Cancelled',
      message: `Your order #${orderId} has been cancelled.`,
    };
  }

  if (newStatus === 'completed' && actorType === ActorType.System) {
    return {
      title: 'Order Auto-Completed',
      message: `Your order #${orderId} has been automatically completed. You can now leave a review.`,
    };
  }

  if (newStatus === 'completed') {
    return {
      title: 'Order Completed',
      message: `Your order #${orderId} has been completed. You can now leave a review.`,
    };
  }

  return {
    title: 'Order Status Updated',
    message: `Your order #${orderId} has been updated to ${newLabel}.`,
  };
}

function buildSellerMessage(
  orderId: number,
  newStatus: string,
  actorType: ActorType,
): { title: string; message: string } {
  if (newStatus === 'completed' && actorType === ActorType.Customer) {
    return {
      title: 'Receipt Confirmed',
      message: `Customer confirmed receipt for order #${orderId}.`,
    };
  }

  if (newStatus === 'return_requested') {
    return {
      title: 'Return Requested',
      message: `Customer requested a return for order #${orderId}. Please review the request.`,
    };
  }

  if (newStatus === 'cancelled' && actorType === ActorType.Customer) {
    return {
      title: 'Order Cancelled',
      message: `Customer cancelled order #${orderId}.`,
    };
  }

  if (newStatus === 'cancelled' && actorType === ActorType.Admin) {
    return {
      title: 'Order Cancelled by Admin',
      message: `Order #${orderId} has been cancelled by an admin.`,
    };
  }

  if (newStatus === 'completed' && actorType === ActorType.Admin) {
    return {
      title: 'Order Completed by Admin',
      message: `Order #${orderId} has been marked as completed by an admin.`,
    };
  }

  const newLabel = STATUS_LABELS[newStatus] || newStatus;
  return {
    title: 'Order Status Updated',
    message: `Order #${orderId} status changed to ${newLabel}.`,
  };
}

export function buildNewOrderMessage(
  orderId: number,
  totalAmount: number,
  itemCount: number,
): { title: string; message: string } {
  const formattedAmount = new Intl.NumberFormat('vi-VN').format(totalAmount);
  return {
    title: 'New Order Received',
    message: `Order #${orderId} placed — ${itemCount} item${itemCount !== 1 ? 's' : ''}, ${formattedAmount}₫.`,
  };
}

export function buildFlashRegistrationReviewedMessage(
  campaignName: string,
  productName: string | null,
  decision: 'approved' | 'rejected',
  reason?: string | null,
): { title: string; message: string } {
  const product = productName ? `"${productName}"` : 'Sản phẩm';
  if (decision === 'approved') {
    return {
      title: 'Đăng ký Flash Sale được duyệt',
      message: `${product} đã được duyệt vào chương trình "${campaignName}".`,
    };
  }
  return {
    title: 'Đăng ký Flash Sale bị từ chối',
    message: reason
      ? `${product} bị từ chối khỏi "${campaignName}": ${reason}`
      : `${product} bị từ chối khỏi "${campaignName}".`,
  };
}
