import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoinRedeemCard } from './CoinRedeemCard';

describe('CoinRedeemCard', () => {
  it('shows the balance and per-order cap', () => {
    render(
      <CoinRedeemCard balance={15000} max={5000} coins={0} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/15.000 Coins/)).toBeInTheDocument();
    expect(screen.getByText(/up to 5.000 Coins/)).toBeInTheDocument();
  });

  it('toggling on requests the max amount', () => {
    const onChange = vi.fn();
    render(
      <CoinRedeemCard balance={15000} max={5000} coins={0} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(5000);
  });

  it('disables redemption when nothing is redeemable', () => {
    render(
      <CoinRedeemCard balance={0} max={0} coins={0} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByText(/no Coins to redeem/i)).toBeInTheDocument();
  });

  it('warns when fewer Coins can be applied than picked', () => {
    render(
      <CoinRedeemCard
        balance={15000}
        max={5000}
        coins={5000}
        applied={3000}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Only 3.000 Coins can be applied/)).toBeInTheDocument();
  });
});
