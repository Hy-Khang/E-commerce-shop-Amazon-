import { create } from 'zustand';
import { useAuthStore } from '@/features/auth';

interface CoinRedemptionState {
  /** Xu the customer wants to redeem at checkout (0 = none). */
  coins: number;
  setCoins: (coins: number) => void;
  clear: () => void;
}

/**
 * Client-only state: the amount of Xu the customer chose to redeem at checkout.
 * Like the voucher selection, this is a UI pick (not server data) so it lives in
 * Zustand. Deliberately NOT persisted — a hard reload drops it, and it never
 * leaks across sessions. Checkout clears it on a successful order; it also resets
 * on logout.
 */
export const useCoinRedemptionStore = create<CoinRedemptionState>((set) => ({
  coins: 0,
  setCoins: (coins) => set({ coins: Math.max(0, Math.trunc(coins || 0)) }),
  clear: () => set({ coins: 0 }),
}));

// Reset the pick on logout so it never carries into the next session.
useAuthStore.subscribe((state, prev) => {
  if (prev.isAuthenticated && !state.isAuthenticated) {
    if (useCoinRedemptionStore.getState().coins > 0) {
      useCoinRedemptionStore.getState().clear();
    }
  }
});
