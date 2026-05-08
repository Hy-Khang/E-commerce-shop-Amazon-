export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Shipping = 'shipping',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  Cod = 'cod',
  Banking = 'banking',
  Momo = 'momo',
}

export enum PaymentStatus {
  Unpaid = 'unpaid',
  Paid = 'paid',
}
