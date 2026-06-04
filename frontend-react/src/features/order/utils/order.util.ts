import type { OrderStatus, PaymentStatus, PaymentMethod, OrderItem } from '../types/order.types';

export function isOrderCancellable(status: OrderStatus): boolean {
  return status === 'pending';
}

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'shipping': return 'bg-purple-100 text-purple-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'unpaid': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function calculateItemSubtotal(item: OrderItem): number {
  return item.price * item.quantity;
}

export function calculateOrderItemsTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function getValidNextStatuses(
  current: OrderStatus,
  paymentStatus?: PaymentStatus,
  paymentMethod?: PaymentMethod,
): OrderStatus[] {
  const transitions = VALID_TRANSITIONS[current] ?? [];

  if (paymentMethod && paymentMethod !== 'cod' && paymentStatus === 'unpaid') {
    return transitions.filter((s) => s !== 'delivered');
  }

  return transitions;
}

export function canMarkAsPaid(
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod,
): boolean {
  if (paymentStatus === 'paid') return false;
  if (status === 'cancelled') return false;

  if (paymentMethod === 'cod') {
    return status === 'shipping' || status === 'delivered';
  }

  return true;
}
