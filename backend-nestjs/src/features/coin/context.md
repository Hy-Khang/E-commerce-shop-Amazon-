# Coin Feature (Hoàn Xu / Cashback) — Module 23

## Purpose
Shopee-Xu-style cashback: customers **earn** Xu when an order completes, **redeem**
Xu at checkout for a discount, and Xu **expires** after N days. 1 Xu = 1 VND
(integer). Retention feature.

## Entities
- `coin_batches` — earned lots. Source of truth for balance + expiry, consumed
  FIFO (soonest-to-expire first). Balance = `Σ amount_remaining` where
  `status='active' AND expires_at > now`. Status: active/depleted/expired/reversed.
- `coin_transactions` — immutable ledger (earn/redeem/expire/reverse_earn/refund).
  `amount` is a positive magnitude; sign implied by `type`.

## ⚠️ Cascade path (SQL Server error 1785)
`coin_transactions.batch_id` FK is **NO ACTION** (default), NOT CASCADE/SET NULL.
Otherwise SQL Server sees two cascade paths from `users` (direct + via
`coin_batches`) and refuses the schema — same fix as `messages.sender_id`.

## Endpoints
- `GET /coins/balance` — balance + batches expiring within 30 days (JWT customer)
- `GET /coins/transactions` — paginated ledger (JWT customer)
- Config lives in the **settings** feature: `GET/PATCH /admin/settings/coins`.

## Cross-feature wiring (no listener — synchronous, mirrors coupon reversal)
`OrderModule` imports `CoinModule` + `SettingsModule` and calls `CoinService`
directly (it already holds the order + money data):
- **Redeem** — `redeemForCheckout()` runs inside the checkout queryRunner txn
  (atomic with order creation). Throws on failure.
- **Earn** — `awardForOrder()` on `→ completed` (confirmReceipt, admin/seller
  status update, auto-complete cron). Best-effort try/catch.
- **Reverse/refund** — `reverseEarnForOrder()` + `refundRedemptionForOrder()` on
  `→ cancelled`. Best-effort.
A listener was rejected: `CoinModule` cannot import `OrderModule` (OrderModule
imports CoinModule) → circular. `SettingsService` is passed `config` explicitly
so CoinService stays pure/testable.

## Earn base
`total_amount − shipping_fee` — equivalently items total after coupon and after
the Xu-paid portion (total already nets both out) → can't farm Xu by paying with Xu.

## Redemption allocation
`OrderService` splits redeemed Xu across shop sub-orders with `allocateWithCaps`
([[coupon-distribution-util]]): weights = per-shop items-after-coupon, caps =
per-shop headroom (`itemsTotal − couponDiscount`), so `total_amount ≥ 0` and the
actual redeemed total = Σ allocation (may be < requested when a big coupon shrinks
headroom). `orders.coin_discount` snapshots each sub-order's share.

## Redemption clamps (not reject)
`validateRedemption` resolves `min(requested, cap, balance)` and **clamps**
rather than throwing for the cap/balance — the client's cap is an estimate
(computed without flash prices / exact multi-coupon allocation), so an
over-request must not block checkout. A disabled feature redeems 0. Only a
non-integer is a hard error (COIN_003, defensive); the genuine race is caught in
`redeemForCheckout` (COIN_001). Preview echoes the applied amount as `coins_applied`.

## Known limits (accepted for project scope)
- Reverse-earn after spend only claws back the unspent remainder (no negative
  balance).
- Redeem may be < requested when coupons leave little headroom; FE shows the
  actually-applied amount from the preview.
- Preview is advisory (not a reservation) — checkout re-validates.
- Earn/reverse/refund are best-effort (not wrapped in a txn); idempotency keys on
  the `(order_id, type)` ledger row, so the only residual risk is a partial
  failure between batch and ledger insert (very low; acceptable for scope).

## Related
- [[project_coin_module23]] · settings feature · [[coupon-distribution-util]]
