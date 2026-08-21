import { useQuery } from '@tanstack/react-query';
import { couponService } from '../services/coupon.service';

/** Query-key factory for the customer voucher catalog. */
export const couponKeys = {
  all: ['coupons'] as const,
  available: (cartSig: string) =>
    [...couponKeys.all, 'available', cartSig] as const,
};

/**
 * Selectable-voucher catalog for the current cart (`GET /coupons/available`).
 * Lazy: only fetches while the picker is open and the cart is non-empty. The
 * key includes `cartSig` (the same signature the checkout preview uses), so
 * changing item quantities/contents refetches both in lockstep. Advisory only —
 * `POST /orders/preview` / checkout decide the real allocation.
 */
export function useAvailableCoupons(cartSig: string, enabled: boolean) {
  return useQuery({
    queryKey: couponKeys.available(cartSig),
    queryFn: () => couponService.getAvailable(),
    enabled,
    staleTime: 30_000,
    retry: false,
    select: (res) => res.data.data,
  });
}
