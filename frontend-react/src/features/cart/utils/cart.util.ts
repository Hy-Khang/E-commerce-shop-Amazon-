import type { CartItem } from '../types/cart.types';

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + getEffectivePrice(item) * item.quantity, 0);
}

export function isCartEmpty(items: CartItem[]): boolean {
  return items.length === 0;
}

/** Flash price wins, then sale price, then list price — matches checkout pricing. */
export function getEffectivePrice(item: CartItem): number {
  return item.variant.flash_price ?? item.variant.sale_price ?? item.variant.price;
}

export function getItemTotal(item: CartItem): number {
  return getEffectivePrice(item) * item.quantity;
}

export interface CartShopGrouping {
  shop_id: number | null;
  shop_name: string | null;
  items: CartItem[];
}

/**
 * Groups cart items by their owning shop, preserving first-appearance order.
 * Items with no shop (legacy/null) collapse into one trailing "Other" group.
 */
export function groupItemsByShop(items: CartItem[]): CartShopGrouping[] {
  const groups: CartShopGrouping[] = [];
  const byKey = new Map<number | 'none', CartShopGrouping>();

  for (const item of items) {
    const key = item.shop_id ?? 'none';
    let group = byKey.get(key);
    if (!group) {
      group = {
        shop_id: item.shop_id ?? null,
        shop_name: item.shop_name ?? null,
        items: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}

/**
 * Stable signature of the cart's price-relevant contents. Same formula the
 * checkout/preview + availability queries key on, so any add/remove/quantity/
 * price change invalidates them together. Shared to avoid drift.
 */
export function cartSignature(items: CartItem[]): string {
  return items
    .map((i) => `${i.product_variant_id}:${i.quantity}:${getEffectivePrice(i)}`)
    .join('|');
}

/** Distinct non-null shop ids present in the cart. */
export function cartShopIds(items: CartItem[]): number[] {
  return [
    ...new Set(
      items
        .map((i) => i.shop_id)
        .filter((id): id is number => id != null),
    ),
  ];
}
