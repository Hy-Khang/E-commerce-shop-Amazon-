# Seller Finance (Module 25 — Commission + Wallet + Payout)

## Purpose
Platform commission (chiết khấu sàn) + seller wallet + payout (withdrawal) queue, in one feature
(the three are tightly coupled: charging commission credits the wallet directly).

## Entities
- `commission_transactions` — immutable platform-commission ledger (SÀN's take, for reporting).
  One `charge` per completed order; defensive `reverse` on cancel. Idempotent `(order_id, type)`.
- `seller_wallets` — a seller's withdrawable balance (source of truth); atomic guards on debit.
- `wallet_transactions` — immutable wallet ledger (`sale_earning`/`withdrawal`/`reversal`/`withdrawal_refund`).
- `withdrawal_requests` — payout requests (`pending`/`approved`/`rejected`); amount held on create.
- Config lives in `features/settings`: `commission.enabled/mode/rate_percent` (app_settings) +
  `commission_category_rates` (per-category overrides when `mode='category'`).

## Commission engine (`CommissionService`)
- Called **synchronously** from `OrderService`/`OrderScheduler` at completion (mirror of CoinService — no
  listener → avoids circular dep). This module imports **nothing** from order/product; the order layer
  builds an `OrderCommissionContext { order_id, shop_id, seller_user_id, total_amount, shipping_fee, items[] }`.
- `base = total_amount − shipping_fee` (already net of coupon + Xu). **flat** = `floor(base × rate%)`;
  **category** = allocate base across items by `line_total` (largest-remainder, `commission.util`), each part
  charged its category rate (fallback platform rate). `net = base − commission` → credited to the wallet.
- `order_items.category_id` is snapshotted at checkout so category-mode never joins product at runtime.
  The engine matches that id **exactly** against the rate map — but `SettingsService.getCommissionCategoryRateMap()`
  pre-expands overrides **down the category tree** (nearest-ancestor cascade; a child's own override wins), so a
  parent-only override still covers leaf-assigned products. The util/engine are unchanged; only the map is richer.
- Reverse is defensive/idempotent — `completed` orders aren't cancellable, so it rarely fires; allows a
  controlled negative wallet balance (debt).

## Endpoints
- Seller (`wallet:read` / `withdrawals:create`): `GET /seller/wallet`, `GET /seller/wallet/transactions`,
  `POST /seller/withdrawals`, `GET /seller/withdrawals`.
- Admin (`withdrawals:read/update`): `GET /admin/withdrawals`, `PATCH /admin/withdrawals/:id/approve|reject`.
- Admin commission config (`settings:read/update`): `GET/PATCH /admin/settings/commission`,
  `GET/PUT/DELETE /admin/settings/commission/category-rates[/:categoryId]`.
- Dashboards read commission via `CommissionService.getShopCommissionBreakdown` (seller — returns
  `{ base, commission }` from the ledger's own base so `netRevenue = base − commission` is exact) and
  `getPlatformCommissionNet` (admin — total commission).

## Design notes
- **SQL Server 1785:** secondary FKs (`wallet_transactions.withdrawal_id`, `order_id`) are NO ACTION/SET NULL,
  same fix as `coin_transactions.batch_id`.
- Withdrawal: create holds funds (atomic debit, else `WALLET_002`); reject refunds them. Errors
  `WALLET_001` (404), `_002` (400 insufficient), `_003` (400 not pending).
