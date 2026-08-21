import { describe, it, expect, beforeEach } from 'vitest';
import { useAppliedCouponsStore } from './applied-coupons.store';
import type { CouponValidationResult } from '../types/coupon.types';

function validation(
  code: string,
  shopId: number | null,
): CouponValidationResult {
  return {
    valid: true,
    code,
    discount_type: 'fixed',
    discount_value: 10000,
    max_discount_amount: null,
    min_order_amount: null,
    scope: 'all',
    applicable_category_ids: null,
    applicable_product_ids: null,
    shop_id: shopId,
  };
}

const codes = () =>
  useAppliedCouponsStore.getState().appliedCoupons.map((c) => c.code);

beforeEach(() => {
  useAppliedCouponsStore.setState({ appliedCoupons: [] });
});

describe('useAppliedCouponsStore', () => {
  it('allows one platform coupon plus one coupon per shop', () => {
    const { apply } = useAppliedCouponsStore.getState();
    apply('PLAT', validation('PLAT', null));
    apply('S1', validation('S1', 1));
    apply('S2', validation('S2', 2));
    expect(codes()).toEqual(['PLAT', 'S1', 'S2']);
  });

  it('replaces the coupon in the same group (≤1 per group)', () => {
    const { apply } = useAppliedCouponsStore.getState();
    apply('PLAT_A', validation('PLAT_A', null));
    apply('PLAT_B', validation('PLAT_B', null));
    expect(codes()).toEqual(['PLAT_B']);

    apply('S1_A', validation('S1_A', 1));
    apply('S1_B', validation('S1_B', 1));
    expect(codes()).toEqual(['PLAT_B', 'S1_B']);
  });

  it('remove drops only the named coupon', () => {
    const { apply, remove } = useAppliedCouponsStore.getState();
    apply('PLAT', validation('PLAT', null));
    apply('S1', validation('S1', 1));
    remove('PLAT');
    expect(codes()).toEqual(['S1']);
  });

  it('reconcile prunes shop coupons whose shop left the cart, keeps platform', () => {
    const { apply, reconcile } = useAppliedCouponsStore.getState();
    apply('PLAT', validation('PLAT', null));
    apply('S1', validation('S1', 1));
    apply('S2', validation('S2', 2));

    reconcile([1], false); // only shop 1 remains in the cart
    expect(codes()).toEqual(['PLAT', 'S1']);
  });

  it('reconcile clears everything when the cart is empty', () => {
    const { apply, reconcile } = useAppliedCouponsStore.getState();
    apply('PLAT', validation('PLAT', null));
    apply('S1', validation('S1', 1));

    reconcile([], true);
    expect(codes()).toEqual([]);
  });

  it('reconcile does not create a new array when nothing changes', () => {
    const { apply, reconcile } = useAppliedCouponsStore.getState();
    apply('PLAT', validation('PLAT', null));
    apply('S1', validation('S1', 1));
    const before = useAppliedCouponsStore.getState().appliedCoupons;

    reconcile([1], false); // both still valid
    const after = useAppliedCouponsStore.getState().appliedCoupons;
    expect(after).toBe(before); // same reference → no render churn
  });

  it('clear empties the selection', () => {
    const { apply, clear } = useAppliedCouponsStore.getState();
    apply('PLAT', validation('PLAT', null));
    clear();
    expect(codes()).toEqual([]);
  });
});
