import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AiOrderPlacedCard } from './AiOrderPlacedCard';

describe('AiOrderPlacedCard', () => {
  it('shows a success notification with the order code and next-step actions', () => {
    const onPick = vi.fn();
    render(
      <MemoryRouter>
        <AiOrderPlacedCard
          order={{ order_group_id: 'abcd1234-xyz', payment_method: 'cod' }}
          onPickSuggestion={onPick}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Order placed successfully!')).toBeInTheDocument();
    expect(screen.getByText('abcd1234')).toBeInTheDocument();
    expect(screen.getByText('What would you like to do next?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view my orders/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /keep shopping/i }));
    expect(onPick).toHaveBeenCalledWith('Suggest some products for me');
  });

  it('prompts to complete payment for online methods', () => {
    render(
      <MemoryRouter>
        <AiOrderPlacedCard
          order={{ order_group_id: 'ef567890-abc', payment_method: 'vnpay' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/complete the payment/i)).toBeInTheDocument();
  });
});
