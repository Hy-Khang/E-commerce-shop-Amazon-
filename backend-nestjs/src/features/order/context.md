# Order Feature

## Purpose
Checkout, order creation with immutable snapshots, status management, customer confirmation flow, auto-completion.

## Owned Entities
- `orders` — status, payment, shipping address (JSON snapshot), coupon snapshots, `delivered_at` timestamp
- `order_items` — immutable snapshots of product data at purchase time, including shop_id + shop_name snapshots

## Status Flow
```
pending → confirmed → shipping → delivered
                                   ├─ customer confirm receipt → completed (terminal)
                                   ├─ customer return request  → return_requested
                                   │     ├─ admin approve → cancelled
                                   │     └─ admin reject  → completed
                                   └─ auto-complete (7 days) → completed
```

**Transition ownership:**
- **Customer:** `pending → cancelled`, `delivered → completed`, `delivered → return_requested`
- **Admin:** `pending → confirmed/cancelled`, `confirmed → shipping/cancelled`, `shipping → delivered/cancelled`, `delivered → completed`, `return_requested → completed/cancelled`
- **Seller:** `pending → confirmed → shipping → delivered` (unchanged, stops at delivered)

## Dependencies
- AuthModule — user identity
- CartModule — read cart at checkout
- ProductModule — validate stock, snapshot product data (including shop info)
- ShopModule — resolve seller's shop for seller order endpoints, resolve seller user IDs for notifications

## Events Emitted
- `order.created` — triggers stock deduction in ProductModule
- `order.cancelled` — triggers stock restoration in ProductModule
- `order.status_updated` — triggers notification creation (payload includes `notifyUserIds[]`)

## Scheduler
- `OrderScheduler` — hourly cron auto-completes orders in `delivered` status with `delivered_at` older than 7 days

## Events Listened
- `payment.completed` — `OrderPaymentListener` marks order as paid (`payment_status = 'paid'`)

## Consumed By
- ReviewModule — verifies purchase for review eligibility (requires `completed` status)
- PaymentModule — reads order data for payment validation, updates payment_status via event
- DashboardModule — revenue queries use `completed` status

## Coupon distribution (Phase 3)
- `utils/coupon-distribution.util.ts` holds the **pure** distributor `distributeCheckoutDiscounts(shopItemsTotals, couponItems)`, shared by `checkout` and `previewCheckout` so the two can never drift. A shop coupon lands on its own sub-order first; the platform coupon fills each shop's remaining headroom, capped at `min(applicable, headroom)`, with `allocateWithCaps` **waterfalling** any leftover from a capped shop to shops that still have room (largest-remainder on `MONEY_MINOR = 100` cents). The platform discount is never lost — total given = `min(nominal, Σ caps)`.
- `previewCheckout(userId, dto)` (`POST /orders/preview`) reuses the distributor read-only: no `coupon_usages`, no stock/usage hold. **Advisory, exact-at-the-time, not a reservation** — `POST /orders` re-validates and is the source of truth. Empty cart → all-zero response.
- `findOrderById` (admin) and `findSellerOrderById` (seller) both attach `applied_coupons` via `CouponService.getUsagesForOrder` — same breakdown the customer sees.
