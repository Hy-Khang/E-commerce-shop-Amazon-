export type NotificationType = 'ORDER_STATUS_CHANGED' | 'NEW_ORDER';

export interface OrderStatusChangedData {
  orderId: number;
  oldStatus: string;
  newStatus: string;
  actorType?: 'admin' | 'seller' | 'customer' | 'system';
}

export interface NewOrderData {
  orderId: number;
  totalAmount: number;
  itemCount: number;
}

export type NotificationData = OrderStatusChangedData | NewOrderData;

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData | null;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
  context?: 'customer' | 'seller' | 'admin' | 'shipper';
}
