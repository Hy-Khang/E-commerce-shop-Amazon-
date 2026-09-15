import { describe, it, expect, beforeEach } from 'vitest';
import { useCoinRedemptionStore } from './coin-redemption.store';

describe('useCoinRedemptionStore', () => {
  beforeEach(() => useCoinRedemptionStore.getState().clear());

  it('starts at 0', () => {
    expect(useCoinRedemptionStore.getState().coins).toBe(0);
  });

  it('setCoins floors and clamps negatives to 0', () => {
    useCoinRedemptionStore.getState().setCoins(12.9);
    expect(useCoinRedemptionStore.getState().coins).toBe(12);
    useCoinRedemptionStore.getState().setCoins(-5);
    expect(useCoinRedemptionStore.getState().coins).toBe(0);
  });

  it('clear resets to 0', () => {
    useCoinRedemptionStore.getState().setCoins(500);
    useCoinRedemptionStore.getState().clear();
    expect(useCoinRedemptionStore.getState().coins).toBe(0);
  });
});
