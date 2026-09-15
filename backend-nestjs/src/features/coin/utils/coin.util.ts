/**
 * Xu earned for a completed order. Base is the post-discount items total
 * (excludes shipping and any Xu-paid portion) so customers can't farm Xu by
 * paying with Xu. Rounded down — Xu is a whole integer (1 Xu = 1 VND).
 */
export function computeEarnAmount(base: number, ratePercent: number): number {
  if (base <= 0 || ratePercent <= 0) return 0;
  return Math.floor((base * ratePercent) / 100);
}

/** Max Xu redeemable on a checkout: floor(itemsTotalAfterCoupon × cap% / 100). */
export function computeRedeemCap(
  itemsTotalAfterCoupon: number,
  maxPercent: number,
): number {
  if (itemsTotalAfterCoupon <= 0 || maxPercent <= 0) return 0;
  return Math.floor((itemsTotalAfterCoupon * maxPercent) / 100);
}

/** UTC expiry date `days` days from now. */
export function computeExpiryDate(days: number, from: Date = new Date()): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
