import type { OrderStatus, PaymentStatus, PaymentMethod, OrderItem } from '../types/order.types';

export function isOrderCancellable(status: OrderStatus): boolean {
  return status === 'pending';
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-500 text-amber-700',
  confirmed: 'bg-sky-500 text-sky-700',
  shipping: 'bg-violet-500 text-violet-700',
  delivered: 'bg-emerald-500 text-emerald-700',
  completed: 'bg-teal-500 text-teal-700',
  return_requested: 'bg-orange-500 text-orange-700',
  cancelled: 'bg-rose-500 text-rose-700',
};

export function getStatusColor(status: OrderStatus): string {
  return STATUS_STYLES[status] ?? 'bg-slate-500 text-slate-700';
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'bg-emerald-500 text-emerald-700';
    case 'unpaid': return 'bg-amber-500 text-amber-700';
    default: return 'bg-slate-500 text-slate-700';
  }
}

export function calculateItemSubtotal(item: OrderItem): number {
  return item.price * item.quantity;
}

export function calculateOrderItemsTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  return_requested: ['completed', 'cancelled'],
  cancelled: [],
};

const SELLER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed'],
  confirmed: ['shipping'],
  shipping: ['delivered'],
};

export function getSellerNextStatuses(current: OrderStatus): OrderStatus[] {
  return SELLER_TRANSITIONS[current] ?? [];
}

export function getValidNextStatuses(
  current: OrderStatus,
  paymentStatus?: PaymentStatus,
  paymentMethod?: PaymentMethod,
): OrderStatus[] {
  const transitions = ADMIN_TRANSITIONS[current] ?? [];

  if (paymentMethod && paymentMethod !== 'cod' && paymentStatus === 'unpaid') {
    return transitions.filter((s) => s !== 'delivered');
  }

  return transitions;
}

export function groupItemsByShop(items: OrderItem[]): Map<number | null, { shopName: string; shopSlug: string | null; items: OrderItem[] }> {
  const groups = new Map<number | null, { shopName: string; shopSlug: string | null; items: OrderItem[] }>();

  for (const item of items) {
    const key = item.shop_id;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        shopName: item.shop_name ?? 'Nook',
        shopSlug: item.shop_slug ?? null,
        items: [item],
      });
    }
  }

  return groups;
}

export function canMarkAsPaid(
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod,
): boolean {
  if (paymentStatus === 'paid') return false;
  if (status === 'cancelled' || status === 'return_requested') return false;

  if (paymentMethod === 'cod') {
    return status === 'shipping' || status === 'delivered';
  }

  return true;
}
