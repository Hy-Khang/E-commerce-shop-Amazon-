# Coin Feature (Hoàn Xu / Cashback) — Frontend

## Purpose
Customer-facing Xu wallet + checkout redemption, plus the admin config page.
Mirrors the backend Module 23. 1 Xu = 1 ₫ (integer).

## Pages
- `CoinWalletPage` (`/wallet`, under AccountLayout) — balance, batches expiring
  soon, paginated ledger.
- `AdminCoinSettingsPage` (`/admin/settings/coins`, PortalGuard `settings:read`)
  — RHF+Zod form for enabled / earn rate / redeem cap / expiry (admin slate/teal).

## Components
- `CoinRedeemCard` — checkout card; toggle + bounded input to redeem Xu, capped at
  the per-order max (50% of items) and the balance.

## API deps
- `GET /coins/balance`, `GET /coins/transactions` (customer, JWT)
- `GET/PATCH /admin/settings/coins` (`settings:read` / `settings:update`)
- Redemption itself rides on `POST /orders` + `POST /orders/preview` via the order
  feature (`coins_to_redeem`).

## State
- `useCoinRedemptionStore` (Zustand, not persisted) — the customer's chosen Xu to
  redeem, shared into the CheckoutPage summary + submit. Cleared on order success
  and on logout (mirrors `useAppliedCouponsStore`).
- Server data (balance, ledger, settings) → TanStack Query (`coinKeys`).

## Checkout integration
`CheckoutPage` computes `max = min(balance, floor(itemsAfterCoupon × 50%))`, renders
`CoinRedeemCard`, threads `coins_to_redeem` into `usePreviewCheckout` and the
checkout request, and shows the `coin_discount` line from the preview. The preview
returns `coins_applied` (may be < requested when a coupon shrinks headroom).
