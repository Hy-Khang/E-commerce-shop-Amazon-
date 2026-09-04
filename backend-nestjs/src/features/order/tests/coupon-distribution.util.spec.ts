import {
  allocateWithCaps,
  distributeCheckoutDiscounts,
} from '../utils/coupon-distribution.util';
import { ICouponCalculationItem } from '../../coupon/types/coupon.types';

// ─── Helpers ───

function platform(
  discount: number,
  applicable: Record<number, number>,
  code = 'PLATFORM',
  id = 1,
): ICouponCalculationItem {
  return {
    coupon_id: id,
    coupon_code: code,
    coupon_shop_id: null,
    discount_amount: discount,
    applicable_by_shop: applicable,
  };
}

function shopCoupon(
  shopId: number,
  discount: number,
  applicable: Record<number, number>,
  code = `SHOP${shopId}`,
  id = 100 + shopId,
): ICouponCalculationItem {
  return {
    coupon_id: id,
    coupon_code: code,
    coupon_shop_id: shopId,
    discount_amount: discount,
    applicable_by_shop: applicable,
  };
}

const sumDiscounts = (m: Map<number, { discount: number }>) =>
  [...m.values()].reduce((s, d) => s + d.discount, 0);

// ─── allocateWithCaps ───

describe('allocateWithCaps', () => {
  it('splits proportionally when no cap binds', () => {
    const out = allocateWithCaps(
      100,
      new Map([
        [1, 1],
        [2, 1],
      ]),
      new Map([
        [1, 1000],
        [2, 1000],
      ]),
    );
    expect(out.get(1)).toBe(50);
    expect(out.get(2)).toBe(50);
  });

  it('caps a shop and waterfalls the excess to shops with room', () => {
    const out = allocateWithCaps(
      100,
      new Map([
        [1, 1],
        [2, 1],
      ]),
      new Map([
        [1, 10],
        [2, 1000],
      ]),
    );
    expect(out.get(1)).toBe(10); // capped
    expect(out.get(2)).toBe(90); // absorbed the leftover
    expect(out.get(1)! + out.get(2)!).toBe(100);
  });

  it('never distributes more than Σ caps', () => {
    const out = allocateWithCaps(
      100,
      new Map([
        [1, 1],
        [2, 1],
      ]),
      new Map([
        [1, 10],
        [2, 20],
      ]),
    );
    expect(out.get(1)).toBe(10);
    expect(out.get(2)).toBe(20);
  });

  it('returns zeros for non-positive target', () => {
    const out = allocateWithCaps(0, new Map([[1, 1]]), new Map([[1, 100]]));
    expect(out.get(1)).toBe(0);
  });
});

// ─── distributeCheckoutDiscounts ───

describe('distributeCheckoutDiscounts', () => {
  const shops = () =>
    new Map<number, number>([
      [1, 100_000],
      [2, 300_000],
    ]);

  it('platform-only: splits by applicable subtotal, sums exactly', () => {
    const out = distributeCheckoutDiscounts(shops(), [
      platform(40_000, { 1: 100_000, 2: 300_000 }),
    ]);
    expect(out.get(1)!.discount).toBe(10_000);
    expect(out.get(2)!.discount).toBe(30_000);
    expect(sumDiscounts(out)).toBe(40_000);
    expect(out.get(1)!.couponCode).toBe('PLATFORM');
  });

  it('shop-only: discount lands only on its own shop', () => {
    const out = distributeCheckoutDiscounts(shops(), [
      shopCoupon(1, 20_000, { 1: 100_000 }),
    ]);
    expect(out.get(1)!.discount).toBe(20_000);
    expect(out.get(1)!.couponCode).toBe('SHOP1');
    expect(out.get(2)!.discount).toBe(0);
    expect(out.get(2)!.couponCode).toBeNull();
    expect(out.get(2)!.usages).toHaveLength(0);
  });

  it('combined without waterfall: shop coupon first, platform fills the rest', () => {
    const out = distributeCheckoutDiscounts(shops(), [
      shopCoupon(1, 10_000, { 1: 100_000 }),
      platform(40_000, { 1: 100_000, 2: 300_000 }),
    ]);
    // shop1: 10k shop + 10k platform share; shop2: 30k platform share
    expect(out.get(1)!.discount).toBe(20_000);
    expect(out.get(2)!.discount).toBe(30_000);
    expect(out.get(1)!.usages).toHaveLength(2);
    expect(out.get(1)!.couponCode).toBe('SHOP1'); // shop coupon preferred
    expect(out.get(2)!.couponCode).toBe('PLATFORM');
    expect(sumDiscounts(out)).toBe(50_000); // 10k shop + 40k platform
  });

  it('waterfall: platform excess from a capped shop flows to another shop', () => {
    // shop1 shop-coupon eats almost all its headroom (100k − 98k = 2k left)
    const out = distributeCheckoutDiscounts(shops(), [
      shopCoupon(1, 98_000, { 1: 100_000 }),
      platform(60_000, { 1: 100_000, 2: 300_000 }),
    ]);

    // Naive proportional would give shop1 15k platform (clamped to 2k, 13k lost).
    // Waterfall keeps the full 60k: shop1 platform = 2k, shop2 platform = 58k.
    const shop1 = out.get(1)!;
    const shop2 = out.get(2)!;

    expect(shop1.discount).toBe(100_000); // 98k shop + 2k platform = full items total
    expect(shop2.discount).toBe(58_000); // 45k fair share + 13k redistributed

    // platform total is preserved (nothing lost)
    const platformGiven =
      (shop1.usages.find((u) => u.couponCode === 'PLATFORM')?.amount ?? 0) +
      (shop2.usages.find((u) => u.couponCode === 'PLATFORM')?.amount ?? 0);
    expect(platformGiven).toBe(60_000);

    // no shop's platform share exceeds min(headroom, applicable)
    expect(shop1.usages.find((u) => u.couponCode === 'PLATFORM')!.amount).toBe(
      2_000,
    );
  });

  it('keeps every part exact (largest-remainder) on uneven splits', () => {
    const out = distributeCheckoutDiscounts(
      new Map([
        [1, 100],
        [2, 100],
        [3, 100],
      ]),
      [platform(100, { 1: 100, 2: 100, 3: 100 })],
    );
    // 100 / 3 → 33.33 + 33.33 + 33.34, summing exactly to 100
    expect(sumDiscounts(out)).toBe(100);
  });

  it('no coupons → zero discount for every shop', () => {
    const out = distributeCheckoutDiscounts(shops(), []);
    expect(out.get(1)!.discount).toBe(0);
    expect(out.get(2)!.discount).toBe(0);
  });
});
