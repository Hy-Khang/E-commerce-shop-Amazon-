import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { orderKeys } from './useOrders';

/**
 * Advisory checkout estimate from `POST /orders/preview` — the exact totals the
 * server would compute (per-shop shipping, discount split, grand total), so the
 * UI never drifts from checkout.
 *
 * Fires whenever `enabled` is true (the checkout page passes `cart non-empty`)
 * so the summary shows exact per-shop shipping even with no coupon applied. The
 * key includes `cartSig` so changing item quantities/contents refetches. Not a
 * reservation — `POST /orders` is the source of truth and may differ (a coupon
 * can run out in between).
 */
export function usePreviewCheckout(
  codes: string[],
  cartSig: string,
  coins = 0,
  enabled = true,
) {
  return useQuery({
    queryKey: orderKeys.preview(codes, cartSig, coins),
    queryFn: () =>
      orderService.preview({
        coupon_codes: codes,
        coins_to_redeem: coins > 0 ? coins : undefined,
      }),
    enabled,
    staleTime: 0,
    retry: false,
    select: (res) => res.data.data,
  });
}
