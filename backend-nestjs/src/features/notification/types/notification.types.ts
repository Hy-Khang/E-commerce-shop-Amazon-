export enum NotificationType {
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  NEW_ORDER = 'NEW_ORDER',
  FLASH_SALE_REGISTRATION_REVIEWED = 'FLASH_SALE_REGISTRATION_REVIEWED',
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
  actorId?: number;
}

export interface OrderPlacedEvent {
  orderId: number;
  customerId: number;
  sellerUserIds: number[];
  totalAmount: number;
  itemCount: number;
}

export interface FlashRegistrationReviewedEvent {
  itemId: number;
  campaignId: number;
  campaignName: string;
  shopId: number;
  sellerUserId: number;
  productName: string | null;
  decision: 'approved' | 'rejected';
  reason?: string | null;
}
