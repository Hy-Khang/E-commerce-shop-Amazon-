export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Shipping = 'shipping',
  Delivered = 'delivered',
  Completed = 'completed',
  ReturnRequested = 'return_requested',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  Cod = 'cod',
  VnPay = 'vnpay',
  Momo = 'momo',
}

export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
}

export enum PaymentGateway {
  VnPay = 'vnpay',
  Momo = 'momo',
}

export enum PaymentStatus {
  Unpaid = 'unpaid',
  Paid = 'paid',
}

export enum ShopStatus {
  PendingVerification = 'pending_verification',
  Active = 'active',
  Suspended = 'suspended',
  Banned = 'banned',
}
