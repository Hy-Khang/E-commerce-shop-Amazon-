import {
  CommissionOrderItem,
  OrderCommissionContext,
} from '../types/seller-finance.types';
import type { CommissionConfig } from '../../settings/types/settings.types';
import { CommissionMode } from '../../settings/types/settings.types';

/**
 * Distribute an integer `total` across `weights` using the largest-remainder
 * method, so the parts are integers that sum EXACTLY to `total`. When every
 * weight is zero the whole total lands on the first bucket (defensive — the
 * caller falls back to flat before relying on this).
 */
export function allocateByWeights(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const out = new Array<number>(n).fill(0);
    out[0] = total;
    return out;
  }

  const exact = weights.map((w) => (w / sum) * total);
  const floors = exact.map((e) => Math.floor(e));
  let remainder = total - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac);

  const out = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++) {
    out[order[k].i] += 1;
    remainder -= 1;
  }
  return out;
}

/**
 * The commission base for an order: `total_amount − shipping_fee` (already net
 * of coupon + Xu), floored to an integer VND. The single source of truth for
 * the base — both `computeCommission` and `CommissionService` use it, so the
 * ledger's `base_amount`, the wallet net, and the effective rate never disagree.
 */
export function commissionBase(ctx: OrderCommissionContext): number {
  return Math.floor(Number(ctx.total_amount) - Number(ctx.shipping_fee));
}

/** Round a rate percent (0–100) against a base to an integer commission. */
function flatCommission(base: number, ratePercent: number): number {
  return Math.floor((base * ratePercent) / 100);
}

/**
 * Compute the platform commission for one order given the runtime config and
 * (for category mode) optional per-category rate overrides.
 *
 * - `base` = `total_amount − shipping_fee` (already net of coupon + Xu), floored
 *   to an integer VND.
 * - **flat:** `floor(base × rate_percent%)`.
 * - **category:** `base` is split across the order's items by their `line_total`
 *   (largest-remainder), each part is charged the rate of its category
 *   (`categoryRates[category_id]`, falling back to the platform `rate_percent`
 *   when the category has no override or the item has no category), and the
 *   parts are summed. With no items it degrades to flat.
 */
export function computeCommission(
  ctx: OrderCommissionContext,
  config: CommissionConfig,
  categoryRates: Map<number, number>,
): number {
  const base = commissionBase(ctx);
  if (base <= 0) return 0;

  if (config.mode !== CommissionMode.Category || ctx.items.length === 0) {
    return flatCommission(base, config.rate_percent);
  }

  const items: CommissionOrderItem[] = ctx.items;
  const weights = items.map((it) => Math.max(0, Number(it.line_total)));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    return flatCommission(base, config.rate_percent);
  }

  const parts = allocateByWeights(base, weights);
  let commission = 0;
  for (let i = 0; i < items.length; i++) {
    const categoryId = items[i].category_id;
    const rate =
      categoryId != null && categoryRates.has(categoryId)
        ? categoryRates.get(categoryId)!
        : config.rate_percent;
    commission += flatCommission(parts[i], rate);
  }
  return commission;
}
