import type { CartItem } from '../types/cart.types';

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.variant.sale_price ?? item.variant.price;
    return sum + price * item.quantity;
  }, 0);
}

export function isCartEmpty(items: CartItem[]): boolean {
  return items.length === 0;
}

export function getEffectivePrice(item: CartItem): number {
  return item.variant.sale_price ?? item.variant.price;
}

export function getItemTotal(item: CartItem): number {
  return getEffectivePrice(item) * item.quantity;
}
