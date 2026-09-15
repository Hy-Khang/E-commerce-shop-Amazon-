import { describe, it, expect } from 'vitest';
import { pickVoucherSuggestions } from './voucher-suggestion.util';
import type { CouponAvailability, CouponOption } from '@/features/coupon';

function opt(over: Partial<CouponOption>): CouponOption {
  return {
    code: 'C',
    description: null,
    discount_type: 'percentage',
    discount_value: 10,
    scope: 'all',
    shop_id: null,
    min_order_amount: null,
    max_discount_amount: null,
    applicable_total: 0,
    discount_preview: 0,
    eligible: true,
    starts_at: '',
    expires_at: '',
    ...over,
  };
}

function catalog(platform: CouponOption[]): CouponAvailability {
  return { platform, shops: [] };
}

describe('pickVoucherSuggestions', () => {
  it('returns empty when there is no catalog', () => {
    expect(pickVoucherSuggestions(undefined, [])).toEqual({});
  });

  it('picks the deepest-discount eligible voucher as best', () => {
    const res = pickVoucherSuggestions(
      catalog([
        opt({ code: 'A', discount_preview: 20000 }),
        opt({ code: 'B', discount_preview: 50000 }),
        opt({ code: 'C', discount_preview: 10000 }),
      ]),
      [],
    );
    expect(res.best?.code).toBe('B');
  });

  it('picks the closest below-min voucher as the next tier', () => {
    const res = pickVoucherSuggestions(
      catalog([
        opt({ code: 'FAR', eligible: false, reason: 'below_min', short_of_min: 200000 }),
        opt({ code: 'NEAR', eligible: false, reason: 'below_min', short_of_min: 40000 }),
        // Ineligible for a non-spend reason → never a next-tier teaser.
        opt({ code: 'USED', eligible: false, reason: 'user_limit' }),
      ]),
      [],
    );
    expect(res.nextTier?.code).toBe('NEAR');
  });

  it('excludes already-applied codes from both slots', () => {
    const res = pickVoucherSuggestions(
      catalog([
        opt({ code: 'A', discount_preview: 50000 }),
        opt({ code: 'B', discount_preview: 20000 }),
      ]),
      ['A'],
    );
    expect(res.best?.code).toBe('B');
  });
});
