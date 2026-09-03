import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AiCheckoutProposalCard } from './AiCheckoutProposalCard';
import type { AiCheckoutProposal } from '../types/ai-chat.types';

const checkoutMutate = vi.fn();
let authed = true;

vi.mock('@/features/auth', () => ({
  useAuthStore: (sel: (s: { isAuthenticated: boolean }) => unknown) =>
    sel({ isAuthenticated: authed }),
}));
vi.mock('@/features/user-profile', () => ({
  useAddresses: () => ({
    data: [{ id: 3, full_name: 'A', address_line: 'x', city: 'HN', is_default: true }],
    isLoading: false,
  }),
}));
vi.mock('@/features/order', () => ({
  useCheckout: () => ({ mutateAsync: checkoutMutate, isPending: false }),
}));
vi.mock('@/features/payment', () => ({
  useCreatePayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

  it('gates behind login for guests', () => {
    authed = false;
    renderCard();
    expect(screen.getByText('Sign in to order')).toBeInTheDocument();
    expect(screen.queryByText('Confirm order')).not.toBeInTheDocument();
  });
});
