import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AiCheckoutProposalCard } from './AiCheckoutProposalCard';
import type { AiCheckoutProposal } from '../types/ai-chat.types';

const checkoutMutate = vi.fn();
let authed = true;

vi.mock('@/features/auth', () => ({
  // Store-shaped: the real Zustand store is a callable hook that also exposes
  // `.subscribe` (the ai-chat store subscribes to it for its logout reset).
  useAuthStore: Object.assign(
    (sel: (s: { isAuthenticated: boolean }) => unknown) =>
      sel({ isAuthenticated: authed }),
    { subscribe: () => () => {} },
  ),
}));
vi.mock('@/features/user-profile', () => ({
  useAddresses: () => ({
    data: [{ id: 3, full_name: 'A', address_line: 'x', city: 'HN', is_default: true }],
    isLoading: false,
  }),
}));
vi.mock('@/features/order', () => ({
  useCheckout: () => ({ mutateAsync: checkoutMutate, isPending: false }),
  // Inline voucher editing stays idle unless a code is applied (enabled=dirty).
  usePreviewCheckout: () => ({ data: undefined, isError: false, isFetching: false }),
}));
vi.mock('@/features/payment', () => ({
  useCreatePayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/features/cart', () => ({
  useCart: () => ({ data: { items: [{ id: 1 }] } }),
  cartSignature: () => 'sig',
}));
// Voucher selection now uses the storefront picker — stub it to a single
// apply button and passthrough helpers (the real modal has its own tests).
vi.mock('@/features/coupon', () => ({
  useAvailableCoupons: () => ({ data: undefined, isLoading: false }),
  optionToValidation: (o: { code: string; shop_id?: number | null }) => ({
    code: o.code,
    shop_id: o.shop_id ?? null,
  }),
  CouponSelectorModal: ({
    open,
    onApply,
  }: {
    open: boolean;
    onApply: (code: string, v: unknown) => void;
  }) =>
    open ? (
      <button
        type="button"
        onClick={() => onApply('SALE10', { code: 'SALE10', shop_id: null })}
      >
        stub-apply
      </button>
    ) : null,
}));

const proposal: AiCheckoutProposal = {
  preview: {
    subtotal: 200000,
    discount_total: 0,
    coin_discount: 0,
    coins_applied: 0,
    shipping_total: 15000,
    grand_total: 215000,
    shops: [],
    applied_coupons: [],
  },
  coupon_codes: [],
  coins_to_redeem: 0,
};

function renderCard() {
  return render(
    <MemoryRouter>
      <AiCheckoutProposalCard proposal={proposal} />
    </MemoryRouter>,
  );
}

describe('AiCheckoutProposalCard', () => {
  beforeEach(() => {
    authed = true;
    checkoutMutate.mockReset().mockResolvedValue({ order_group_id: 'abcd1234-xyz' });
  });

  it('shows the preview totals and places a COD order on confirm', async () => {
    renderCard();
    expect(screen.getByText('215.000 ₫')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));

    await waitFor(() =>
      expect(checkoutMutate).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: 'cod', address_id: 3 }),
      ),
    );
    // Success state replaces the form.
    await screen.findByText('Order placed successfully!');
  });

  it('calls onPlaced so the parent can swap in the order-placed card', async () => {
    const onPlaced = vi.fn();
    render(
      <MemoryRouter>
        <AiCheckoutProposalCard proposal={proposal} onPlaced={onPlaced} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));

    await waitFor(() =>
      expect(onPlaced).toHaveBeenCalledWith({
        order_group_id: 'abcd1234-xyz',
        payment_method: 'cod',
      }),
    );
  });

  it('applies a coupon via the picker and includes it on confirm', async () => {
    renderCard();
    // Open the picker (the select trigger) → apply a code via the stubbed modal.
    fireEvent.click(screen.getByRole('button', { name: /voucher/i }));
    fireEvent.click(screen.getByRole('button', { name: 'stub-apply' }));
    // The applied code shows as a removable chip.
    expect(screen.getByText('SALE10')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));
    await waitFor(() =>
      expect(checkoutMutate).toHaveBeenCalledWith(
        expect.objectContaining({ coupon_codes: ['SALE10'] }),
      ),
    );
  });

  it('gates behind login for guests', () => {
    authed = false;
    renderCard();
    expect(screen.getByText('Sign in to order')).toBeInTheDocument();
    expect(screen.queryByText('Confirm order')).not.toBeInTheDocument();
  });
});
