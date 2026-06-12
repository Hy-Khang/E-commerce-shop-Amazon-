export enum NotificationType {
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
}

export interface OrderStatusChangedData {
  orderId: number;
  oldStatus: string;
  newStatus: string;
  actorType?: 'admin' | 'seller' | 'customer' | 'system';
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  data: OrderStatusChangedData | null;
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
