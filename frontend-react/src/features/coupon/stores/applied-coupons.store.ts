import { create } from 'zustand';
import { useAuthStore } from '@/features/auth';
import type {
  AppliedCouponEntry,
  CouponValidationResult,
} from '../types/coupon.types';

/**
 * Group key for the "≤1 coupon per group" rule: one platform coupon plus one
 * coupon per shop. Mirrors the backend stacking constraint and the modal's own
 * grouping.
 */
function groupKey(shopId: number | null | undefined): string {
  return shopId != null ? `shop:${shopId}` : 'platform';
}

interface AppliedCouponsState {
  appliedCoupons: AppliedCouponEntry[];
  apply: (code: string, validation: CouponValidationResult) => void;
  remove: (code: string) => void;
  clear: () => void;
  /**
   * Prune selections that no longer fit the cart: drop shop coupons whose shop
   * left the cart, and clear everything when the cart is empty. Only writes when
   * the list actually changes (avoids render loops when driven from an effect).
   */
  reconcile: (cartShopIds: number[], cartEmpty: boolean) => void;
}

/**
 * Cross-feature client state: the customer's voucher selection, shared between
 * the Cart page and the Checkout page so choices carry over. This is UI state
 * (the user's picks), not server data — Zustand is the right home (same as the
 * cart badge). Deliberately NOT persisted to localStorage: a hard reload drops
 * the selection (matching the previous `useState` behaviour) and avoids stale
 * coupons leaking across carts. Checkout clears it on a successful order.
 */
export const useAppliedCouponsStore = create<AppliedCouponsState>((set) => ({
  appliedCoupons: [],

  apply: (code, validation) =>
    set((state) => {
      const key = groupKey(validation.shop_id);
      // Replace any existing coupon in the same group, then add the new one.
      const withoutGroup = state.appliedCoupons.filter(
        (c) => groupKey(c.validation.shop_id) !== key && c.code !== code,
      );
      return { appliedCoupons: [...withoutGroup, { code, validation }] };
    }),

  remove: (code) =>
    set((state) => ({
      appliedCoupons: state.appliedCoupons.filter((c) => c.code !== code),
    })),

  clear: () => set({ appliedCoupons: [] }),

  reconcile: (cartShopIds, cartEmpty) =>
    set((state) => {
      if (cartEmpty) {
        return state.appliedCoupons.length > 0
          ? { appliedCoupons: [] }
          : state;
      }
      const shopIdSet = new Set(cartShopIds);
      const next = state.appliedCoupons.filter((c) => {
        const shopId = c.validation.shop_id;
        // Keep platform coupons; keep a shop coupon only if its shop is present.
        return shopId == null || shopIdSet.has(shopId);
      });
      return next.length === state.appliedCoupons.length
        ? state
        : { appliedCoupons: next };
    }),
}));

// Drop the selection when the user logs out, so a picked voucher never carries
// into the next session on a shared device (the old per-page useState reset
// naturally). coupon → auth is an allowed dependency direction.
useAuthStore.subscribe((state, prev) => {
  if (prev.isAuthenticated && !state.isAuthenticated) {
    const { appliedCoupons, clear } = useAppliedCouponsStore.getState();
    if (appliedCoupons.length > 0) clear();
  }
});
