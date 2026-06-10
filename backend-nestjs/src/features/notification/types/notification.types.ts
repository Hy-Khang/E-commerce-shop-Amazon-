export enum NotificationType {
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
}

export interface OrderStatusUpdatedEvent {
  orderId: number;
  userId: number;
  notifyUserIds: number[];
  oldStatus: string;
  newStatus: string;
}
