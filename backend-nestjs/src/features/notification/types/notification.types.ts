export enum NotificationType {
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
}

export enum ActorType {
  Admin = 'admin',
  Seller = 'seller',
  Customer = 'customer',
  System = 'system',
}

export enum NotificationContext {
  Customer = 'customer',
  Seller = 'seller',
  Admin = 'admin',
}

export interface OrderStatusUpdatedEvent {
  orderId: number;
  userId: number;
  notifyUserIds: number[];
  oldStatus: string;
  newStatus: string;
  actorType: ActorType;
}
