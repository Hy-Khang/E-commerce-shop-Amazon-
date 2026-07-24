export enum NotificationType {
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  NEW_ORDER = 'NEW_ORDER',
}

export enum ActorType {
  Admin = 'admin',
  Seller = 'seller',
  Customer = 'customer',
  System = 'system',
  Shipper = 'shipper',
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

export interface OrderPlacedEvent {
  orderId: number;
  customerId: number;
  sellerUserIds: number[];
  totalAmount: number;
  itemCount: number;
}
