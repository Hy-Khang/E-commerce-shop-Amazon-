import { ICouponCalculationItem } from '../../coupon/types/coupon.types';

/**
 * Minor-unit factor for money. Matches `DECIMAL(10,2)` (2 fractional digits),
 * so every split/rounding happens on integer cents and the parts sum back
 * exactly. This is a precision factor for 2-decimal money, NOT a "VND × 100"
 * assumption.
 */
export const MONEY_MINOR = 100;

/** One coupon's contribution to a single sub-order (for `coupon_usages`). */
export interface ICheckoutShopDiscountUsage {
  couponId: number;
  couponCode: string;
  amount: number;
}

/** Resolved discount for one shop's sub-order. */
export interface ICheckoutShopDiscount {
  /** Total discount on this sub-order (shop coupon + platform share). */
  discount: number;
  /** Single code snapshot for `orders.coupon_code` (shop preferred, else platform). */
  couponCode: string | null;
  /** One entry per coupon that actually discounted this sub-order. */
  usages: ICheckoutShopDiscountUsage[];
}

/**
 * Allocates `target` (minor units) across shops proportionally to `weights`,
 * never exceeding each shop's `caps` (minor units). Any share a capped shop
 * cannot absorb is **redistributed** (waterfall) to shops that still have
 * room — so a platform discount is never silently lost when one shop's
 * headroom is exhausted by its own shop coupon.
 *
 * Uses largest-remainder rounding each round so the returned amounts sum to
 * exactly `min(target, Σ caps)`. Pure, integer-only.
 */
export function allocateWithCaps(
  target: number,
  weights: Map<number, number>,
  caps: Map<number, number>,
): Map<number, number> {
  const result = new Map<number, number>();
  for (const shopId of weights.keys()) result.set(shopId, 0);

  let capSum = 0;
  for (const c of caps.values()) capSum += Math.max(0, c);
  const target2 = Math.min(Math.max(0, target), capSum);
  if (target2 <= 0) return result;

  // Water-filling: each round either fully distributes the remainder or caps at
  // least one more shop (shrinking `open`), so it converges in ≤ shops rounds.
  for (let guard = 0; guard <= weights.size + 1; guard++) {
    let assigned = 0;
    for (const v of result.values()) assigned += v;
    const remaining = target2 - assigned;
    if (remaining <= 0) break;

    const open: number[] = [];
    let totalWeight = 0;
    for (const [shopId, w] of weights) {
      const room = (caps.get(shopId) ?? 0) - (result.get(shopId) ?? 0);
      if (w > 0 && room > 0) {
        open.push(shopId);
        totalWeight += w;
      }
    }
    if (open.length === 0 || totalWeight <= 0) break;

    const parts = open.map((shopId) => {
      const exact = (remaining * (weights.get(shopId) ?? 0)) / totalWeight;
      const floorv = Math.floor(exact);
      return { shopId, floorv, frac: exact - floorv };
    });
    let leftover = remaining - parts.reduce((s, p) => s + p.floorv, 0);
    parts.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < parts.length && leftover > 0; i++) {
      parts[i].floorv += 1;
      leftover--;
    }

    let progressed = false;
    for (const p of parts) {
      const room = (caps.get(p.shopId) ?? 0) - (result.get(p.shopId) ?? 0);
      const give = Math.min(p.floorv, room);
      if (give > 0) {
        result.set(p.shopId, (result.get(p.shopId) ?? 0) + give);
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  return result;
}

/**
 * Pure checkout-discount distributor, shared by `checkout` and the preview
 * endpoint so the two never drift.
 *
 * Rules (multi-coupon: ≤1 platform + ≤1 per shop):
 * - A **shop coupon** discounts only its own shop's sub-order:
 *   `shopCouponDiscount = min(coupon discount, shopItemsTotal)`.
 * - A **platform coupon** is split across shops by each shop's applicable
 *   subtotal, capped per shop at `min(applicable, headroom)` where
 *   `headroom = shopItemsTotal − shopCouponDiscount`. Leftover from a capped
 *   shop waterfalls to shops that still have room.
 *
 * @param shopItemsTotals Map<shopId, gross items subtotal for that shop>.
 * @param couponItems     Validated coupons (from `validateAndCalculateDiscounts`).
 * @returns Map<shopId, { discount, couponCode, usages }> — one entry per shop.
 */
export function distributeCheckoutDiscounts(
  shopItemsTotals: Map<number, number>,
  couponItems: ICouponCalculationItem[],
): Map<number, ICheckoutShopDiscount> {
  const toMinor = (x: number) => Math.round(x * MONEY_MINOR);
  const fromMinor = (m: number) => m / MONEY_MINOR;

  const platformItem =
    couponItems.find((c) => c.coupon_shop_id == null) ?? null;
  const shopCouponMap = new Map<number, ICouponCalculationItem>();
  for (const c of couponItems) {
    if (c.coupon_shop_id != null) shopCouponMap.set(c.coupon_shop_id, c);
  }

  const platformApplicable = platformItem
    ? new Map<number, number>(
        Object.entries(platformItem.applicable_by_shop).map(([k, v]) => [
          Number(k),
          Number(v),
        ]),
      )
    : new Map<number, number>();

  const shopCouponMinor = new Map<number, number>();
  const capMinor = new Map<number, number>();
  const weight = new Map<number, number>();

  for (const [shopId, itemsTotal] of shopItemsTotals) {
    const itemsMinor = toMinor(itemsTotal);
    const sc = shopCouponMap.get(shopId) ?? null;
    const scMinor = sc ? Math.min(toMinor(sc.discount_amount), itemsMinor) : 0;
    shopCouponMinor.set(shopId, scMinor);

    const headroom = Math.max(0, itemsMinor - scMinor);
    const applicableMinor = toMinor(platformApplicable.get(shopId) ?? 0);
    capMinor.set(shopId, Math.min(applicableMinor, headroom));
    weight.set(shopId, applicableMinor);
  }

  let platformShareMinor = new Map<number, number>();
  if (platformItem && platformItem.discount_amount > 0) {
    platformShareMinor = allocateWithCaps(
      toMinor(platformItem.discount_amount),
      weight,
      capMinor,
    );
  }

  const result = new Map<number, ICheckoutShopDiscount>();
  for (const [shopId] of shopItemsTotals) {
    const scMinor = shopCouponMinor.get(shopId) ?? 0;
    const pfMinor = platformShareMinor.get(shopId) ?? 0;
    const sc = shopCouponMap.get(shopId) ?? null;

    const usages: ICheckoutShopDiscountUsage[] = [];
    if (sc && scMinor > 0) {
      usages.push({
        couponId: sc.coupon_id,
        couponCode: sc.coupon_code,
        amount: fromMinor(scMinor),
      });
    }
    if (platformItem && pfMinor > 0) {
      usages.push({
        couponId: platformItem.coupon_id,
        couponCode: platformItem.coupon_code,
        amount: fromMinor(pfMinor),
      });
    }

    const couponCode =
      sc && scMinor > 0
        ? sc.coupon_code
        : platformItem && pfMinor > 0
          ? platformItem.coupon_code
          : null;

    result.set(shopId, {
      discount: fromMinor(scMinor + pfMinor),
      couponCode,
      usages,
    });
  }

  return result;
}
