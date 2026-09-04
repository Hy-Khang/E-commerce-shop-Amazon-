import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiCheckoutVoucher } from './AiCheckoutVoucher';
import type { CouponOption } from '@/features/coupon';

// The picker modal is tested on its own; here we only need the passthrough
// helper + a no-op modal so the voucher section renders in isolation.
vi.mock('@/features/coupon', () => ({
  optionToValidation: (o: { code: string; shop_id?: number | null }) => ({
    code: o.code,
    shop_id: o.shop_id ?? null,
  }),
  CouponSelectorModal: () => null,
}));

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

describe('AiCheckoutVoucher', () => {
  it('applies the best suggested voucher on tap', () => {
    const onApply = vi.fn();
    render(
      <AiCheckoutVoucher
        cartSig="sig"
        applied={[]}
        suggestions={{ best: opt({ code: 'SALE20', discount_preview: 20000 }) }}
        onApply={onApply}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('SALE20').closest('button')!);
    expect(onApply).toHaveBeenCalledWith(
      'SALE20',
      expect.objectContaining({ code: 'SALE20' }),
    );
  });

  it('shows a next-tier "spend more" teaser', () => {
    render(
      <AiCheckoutVoucher
        cartSig="sig"
        applied={[]}
        suggestions={{
          nextTier: opt({
            code: 'SALE30',
            eligible: false,
            reason: 'below_min',
            short_of_min: 71000,
          }),
        }}
        onApply={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/more to unlock/i)).toBeInTheDocument();
    expect(screen.getByText('SALE30')).toBeInTheDocument();
  });

  it('renders applied vouchers as removable chips', () => {
    const onRemove = vi.fn();
    render(
      <AiCheckoutVoucher
        cartSig="sig"
        applied={[
          {
            code: 'MYCODE',
            validation: {
              valid: true,
              code: 'MYCODE',
              discount_type: 'percentage',
              discount_value: 10,
              max_discount_amount: null,
              min_order_amount: null,
              scope: 'all',
              applicable_category_ids: null,
              applicable_product_ids: null,
              shop_id: null,
            },
          },
        ]}
        suggestions={{}}
        onApply={vi.fn()}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove MYCODE' }));
    expect(onRemove).toHaveBeenCalledWith('MYCODE');
  });
});
