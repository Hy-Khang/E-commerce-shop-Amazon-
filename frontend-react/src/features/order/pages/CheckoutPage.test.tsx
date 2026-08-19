import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/core/api/api.types';
import type { CheckoutPreview } from '../types/order.types';

// ─── Hoisted mocks (referenced inside vi.mock factories) ───
const h = vi.hoisted(() => ({
  useCart: vi.fn(),
  useAddresses: vi.fn(),
  useCheckout: vi.fn(),
  useCreatePayment: vi.fn(),
  usePreviewCheckout: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => h.navigate }));
vi.mock('@/features/cart', () => ({ useCart: h.useCart }));
vi.mock('@/features/payment', () => ({ useCreatePayment: h.useCreatePayment }));
vi.mock('../hooks/useCheckout', () => ({ useCheckout: h.useCheckout }));
vi.mock('../hooks/useAddresses', () => ({ useAddresses: h.useAddresses }));
vi.mock('../hooks/usePreviewCheckout', () => ({
  usePreviewCheckout: (...args: unknown[]) => h.usePreviewCheckout(...args),
}));
// Keep the item list out of the way — not under test here.
vi.mock('../components/OrderItemRow', () => ({ OrderItemRow: () => <div /> }));
// Stub the coupon input so a test can drive apply/remove without the real form.
vi.mock('@/features/coupon', () => ({
  CouponInput: ({ appliedCoupons, onApply, onRemove }: any) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onApply('BADCODE', { discount_type: 'fixed', discount_value: 50000 })
        }
      >
        apply-coupon
      </button>
      {appliedCoupons.map((c: any) => (
        <button type="button" key={c.code} onClick={() => onRemove(c.code)}>
          remove-{c.code}
        </button>
      ))}
    </div>
  ),
}));

// Imported after the mocks are registered.
import CheckoutPage from './CheckoutPage';

// ─── Fixtures ───
const CART = {
  items: [
    {
      id: 11,
      product_variant_id: 101,
      quantity: 2,
      variant: {
        sale_price: null,
        price: 100000,
        product_name: 'P1',
        sku: 'S1',
        thumbnail_url: null,
      },
    },
    {
      id: 12,
      product_variant_id: 102,
      quantity: 1,
      variant: {
        sale_price: null,
        price: 300000,
        product_name: 'P2',
        sku: 'S2',
        thumbnail_url: null,
      },
    },
  ],
}; // local subtotal = 2*100000 + 300000 = 500000

const ADDRESS = {
  id: 7,
  user_id: 1,
  full_name: 'Alice',
  phone: '0900000000',
  address_line: '1 Main St',
  city: 'Hanoi',
  latitude: null,
  longitude: null,
  is_default: true,
};

const twoShopPreview: CheckoutPreview = {
  subtotal: 500000,
  discount_total: 0,
  shipping_total: 60000,
  grand_total: 560000,
  shops: [
    { shop_id: 1, shop_name: 'Shop One', items_total: 200000, discount_amount: 0, shipping_fee: 30000, total: 230000, coupons: [] },
    { shop_id: 2, shop_name: 'Shop Two', items_total: 300000, discount_amount: 0, shipping_fee: 30000, total: 330000, coupons: [] },
  ],
  applied_coupons: [],
};

const singleShopPreview: CheckoutPreview = {
  subtotal: 200000,
  discount_total: 0,
  shipping_total: 30000,
  grand_total: 230000,
  shops: [
    { shop_id: 1, shop_name: 'Shop One', items_total: 200000, discount_amount: 0, shipping_fee: 30000, total: 230000, coupons: [] },
  ],
  applied_coupons: [],
};

function previewResult(over: Partial<ReturnType<typeof baseResult>> = {}) {
  return { ...baseResult(), ...over };
}
function baseResult() {
  return { data: undefined as CheckoutPreview | undefined, isError: false, error: null as unknown };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.useCart.mockReturnValue({ data: CART, isLoading: false });
  h.useAddresses.mockReturnValue({ data: [ADDRESS], isLoading: false });
  h.useCheckout.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, error: null });
  h.useCreatePayment.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, error: null });
  h.usePreviewCheckout.mockReturnValue(previewResult());
});

describe('CheckoutPage summary', () => {
  it('multi-shop preview: renders per-shop breakdown, exact shipping and grand total', () => {
    h.usePreviewCheckout.mockReturnValue(previewResult({ data: twoShopPreview }));
    render(<CheckoutPage />);

    expect(screen.getByText(/Order breakdown by shop \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('Shop One')).toBeInTheDocument();
    expect(screen.getByText('Shop Two')).toBeInTheDocument();
    // exact shipping from the server, not the "calculated after order" placeholder
    expect(screen.queryByText(/Calculated after order/i)).not.toBeInTheDocument();
    // grand total 560.000 (regex avoids the narrow-no-break-space in the ₫ format)
    expect(screen.getByText(/560\.000/)).toBeInTheDocument();
  });

  it('single-shop preview: exact numbers but no per-shop breakdown block', () => {
    h.usePreviewCheckout.mockReturnValue(previewResult({ data: singleShopPreview }));
    render(<CheckoutPage />);

    expect(screen.queryByText(/Order breakdown by shop/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Calculated after order/i)).not.toBeInTheDocument();
    expect(screen.getByText(/230\.000/)).toBeInTheDocument();
  });

  it('empty preview shops: falls back to local subtotal instead of a 0 total', () => {
    // Server skipped every item (no shop_id) → all zeros. Must NOT show 0 total.
    h.usePreviewCheckout.mockReturnValue(
      previewResult({
        data: { subtotal: 0, discount_total: 0, shipping_total: 0, grand_total: 0, shops: [], applied_coupons: [] },
      }),
    );
    render(<CheckoutPage />);

    // local subtotal 500000 shown (subtotal + estimated total); 0-grand-total not trusted
    expect(screen.getAllByText(/500\.000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Calculated after order/i)).toBeInTheDocument();
  });
});

describe('CheckoutPage coupon gating', () => {
  it('coupon-level rejection (COUPON_*) disables Place Order and shows no phantom discount', async () => {
    const user = userEvent.setup();
    h.usePreviewCheckout.mockReturnValue(
      previewResult({ isError: true, error: new ApiError('COUPON_002', 'Coupon expired', 400) }),
    );
    render(<CheckoutPage />);

    await user.click(screen.getByRole('button', { name: 'apply-coupon' }));

    const submit = screen.getByRole('button', { name: /Remove invalid coupon to continue/i });
    expect(submit).toBeDisabled();
    // no discount line for the rejected coupon
    expect(screen.queryByText(/Coupon \(BADCODE\)/)).not.toBeInTheDocument();
  });

  it('transient (non-coupon) error keeps Place Order enabled', async () => {
    const user = userEvent.setup();
    h.usePreviewCheckout.mockReturnValue(
      previewResult({ isError: true, error: new ApiError('COMMON_002', 'Server error', 500) }),
    );
    render(<CheckoutPage />);

    await user.click(screen.getByRole('button', { name: 'apply-coupon' }));

    const submit = screen.getByRole('button', { name: /Place Order/i });
    expect(submit).toBeEnabled();
  });
});
