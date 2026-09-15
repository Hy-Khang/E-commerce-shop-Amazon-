import type { CouponAvailability, CouponOption } from '@/features/coupon';

export interface VoucherSuggestions {
  /** Deepest-discount voucher eligible for the cart right now (one-tap apply). */
  best?: CouponOption;
  /**
   * Closest locked voucher whose only blocker is spend (`below_min`) — the next
   * reward tier. Carries `short_of_min` → "spend X more to unlock".
   */
  nextTier?: CouponOption;
}

function flatten(catalog: CouponAvailability): CouponOption[] {
  return [...catalog.platform, ...catalog.shops.flatMap((s) => s.coupons)];
}

/**
 * Pick two voucher hints for the mini-checkout, Shopee-style:
 *  - `best`: the deepest-discount voucher eligible for the cart now (tap to apply).
 *  - `nextTier`: the nearest locked voucher gated only by spend (`below_min`) —
 *    "spend X more to unlock (deeper discount)", nudging the shopper up a tier.
 *
 * Already-applied codes are excluded. Advisory only — the server preview/checkout
 * re-validate and decide the real allocation, so this is just a hint layer.
 */
export function pickVoucherSuggestions(
  catalog: CouponAvailability | undefined,
  appliedCodes: string[],
): VoucherSuggestions {
  if (!catalog) return {};
  const applied = new Set(appliedCodes);
  const all = flatten(catalog).filter((o) => !applied.has(o.code));

  const best = all
    .filter((o) => o.eligible)
    .sort((a, b) => b.discount_preview - a.discount_preview)[0];

  // Closest to unlock first; the `below_min` reason means "only more spend needed".
  const nextTier = all
    .filter((o) => !o.eligible && o.reason === 'below_min' && o.short_of_min != null)
    .sort((a, b) => (a.short_of_min ?? Infinity) - (b.short_of_min ?? Infinity))[0];

  return { best, nextTier };
}
