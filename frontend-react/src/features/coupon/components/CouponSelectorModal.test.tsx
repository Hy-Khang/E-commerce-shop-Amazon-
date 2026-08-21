import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  CouponAvailability,
  CouponOption,
  CouponValidationResult,
} from '../types/coupon.types';

// ─── Hoisted mocks ───
const h = vi.hoisted(() => ({
  useAvailableCoupons: vi.fn(),
  validateMutate: vi.fn(),
}));

vi.mock('../hooks/useAvailableCoupons', () => ({
  useAvailableCoupons: (...a: unknown[]) => h.useAvailableCoupons(...a),
  couponKeys: {
    all: ['coupons'],
    available: (s: string) => ['coupons', 'available', s],
  },
}));
vi.mock('../hooks/useValidateCoupon', () => ({
  useValidateCoupon: () => ({
    mutate: h.validateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

import { CouponSelectorModal } from './CouponSelectorModal';

// ─── Fixtures ───
function opt(over: Partial<CouponOption> = {}): CouponOption {
  return {
    code: 'CODE',
    description: null,
    discount_type: 'fixed',
    discount_value: 10000,
    scope: 'all',
    shop_id: null,
    min_order_amount: null,
    max_discount_amount: null,
    applicable_total: 500000,
    discount_preview: 10000,
    eligible: true,
    starts_at: '',
    expires_at: '',
    ...over,
  };
}

const AVAIL: CouponAvailability = {
  platform: [
    opt({ code: 'PLAT10', discount_value: 10000, discount_preview: 10000 }),
    opt({ code: 'PLAT5', discount_value: 5000, discount_preview: 5000 }),
    opt({
      code: 'PLATBIG',
      min_order_amount: 1_000_000,
      discount_preview: 0,
      eligible: false,
      reason: 'below_min',
      short_of_min: 500_000,
    }),
  ],
  shops: [
    {
      shop_id: 1,
      shop_name: 'Shop One',
      coupons: [opt({ code: 'S1-SALE', shop_id: 1, discount_preview: 20000 })],
    },
  ],
};

function renderModal(over: {
  onApply?: (c: string, v: CouponValidationResult) => void;
  onRemove?: (c: string) => void;
  appliedCoupons?: { code: string; validation: CouponValidationResult }[];
} = {}) {
  const onApply = over.onApply ?? vi.fn();
  const onRemove = over.onRemove ?? vi.fn();
  render(
    <CouponSelectorModal
      open
      onClose={vi.fn()}
      appliedCoupons={over.appliedCoupons ?? []}
      onApply={onApply}
      onRemove={onRemove}
      cartSig="sig"
    />,
  );
  return { onApply, onRemove };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.useAvailableCoupons.mockReturnValue({
    data: AVAIL,
    isLoading: false,
    isError: false,
  });
});

describe('CouponSelectorModal', () => {
  it('renders platform + shop groups and marks an ineligible row with its reason', () => {
    renderModal();
    expect(screen.getByText('PLAT10')).toBeInTheDocument();
    expect(screen.getByText('Shop One')).toBeInTheDocument();
    expect(screen.getByText('S1-SALE')).toBeInTheDocument();

    // below_min row disabled + "add X more" hint
    const bigRow = screen.getByText('PLATBIG').closest('button')!;
    expect(bigRow).toBeDisabled();
    expect(screen.getByText(/Add .* more to use/i)).toBeInTheDocument();
  });

  it('selecting an eligible voucher then Apply calls onApply with its code', async () => {
    const user = userEvent.setup();
    const { onApply } = renderModal();

    await user.click(screen.getByText('S1-SALE').closest('button')!);
    await user.click(screen.getByRole('button', { name: 'Apply' })); // footer commit

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('S1-SALE', expect.objectContaining({ shop_id: 1 }));
  });

  it('enforces at most one voucher per group (selecting a second replaces the first)', async () => {
    const user = userEvent.setup();
    const { onApply } = renderModal();

    await user.click(screen.getByText('PLAT10').closest('button')!);
    await user.click(screen.getByText('PLAT5').closest('button')!);
    await user.click(screen.getByRole('button', { name: 'Apply' })); // footer commit

    // Only the last-picked platform coupon is committed.
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('PLAT5', expect.anything());
  });

  it('lets an already-applied voucher be deselected even if it is now ineligible', async () => {
    const user = userEvent.setup();
    // PLATBIG is ineligible in the catalog, but it is already applied.
    const { onRemove, onApply } = renderModal({
      appliedCoupons: [
        {
          code: 'PLATBIG',
          validation: {
            valid: true,
            code: 'PLATBIG',
            discount_type: 'fixed',
            discount_value: 50000,
            max_discount_amount: null,
            min_order_amount: 1_000_000,
            scope: 'all',
            applicable_category_ids: null,
            applicable_product_ids: null,
            shop_id: null,
          },
        },
      ],
    });

    const bigRow = screen.getByText('PLATBIG').closest('button')!;
    expect(bigRow).not.toBeDisabled(); // selected → still clickable
    await user.click(bigRow); // deselect
    await user.click(screen.getByRole('button', { name: 'Apply' })); // footer commit

    expect(onRemove).toHaveBeenCalledWith('PLATBIG');
    expect(onApply).not.toHaveBeenCalled();
  });

  it('manual entry falls back to validate and applies a hidden code (kept, not lost)', async () => {
    const user = userEvent.setup();
    h.validateMutate.mockImplementation(
      (code: string, opts: { onSuccess: (r: CouponValidationResult) => void }) =>
        opts.onSuccess({
          valid: true,
          code,
          discount_type: 'fixed',
          discount_value: 5000,
          max_discount_amount: null,
          min_order_amount: null,
          scope: 'all',
          applicable_category_ids: null,
          applicable_product_ids: null,
          shop_id: null,
        }),
    );
    const { onApply } = renderModal();

    await user.type(screen.getByPlaceholderText(/Enter voucher code/i), 'hidden');
    await user.click(screen.getByRole('button', { name: 'Apply code' })); // manual entry

    expect(h.validateMutate).toHaveBeenCalledWith('HIDDEN', expect.anything());
    // A code not present in the catalog surfaces under "Applied (manual)".
    expect(screen.getByText('Applied (manual)')).toBeInTheDocument();
    expect(screen.getByText('HIDDEN')).toBeInTheDocument();

    // Commit it via the footer.
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith('HIDDEN', expect.objectContaining({ code: 'HIDDEN' }));
  });
});
