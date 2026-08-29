# Flash Sale Feature (Module 17)

## Purpose
Time-windowed discount campaigns (`scheduled → active → ended`). Admin creates a
campaign and adds product variants with a `flash_price` and a limited
`flash_quantity`. The storefront shows live deals (countdown + "sold X%"), and
checkout charges the flash price while safely decrementing `sold_quantity`
(no oversell).

## Entities
- `flash_sales` — campaign (name, starts_at, ends_at, status, is_active).
- `flash_sale_items` — one row per variant on sale (flash_price, flash_quantity,
  sold_quantity). UNIQUE (flash_sale_id, product_variant_id).
- `order_items.flash_sale_item_id` (added here) — snapshot of the flash item a
  line was bought under, so `sold_quantity` can be reversed exactly on cancel.

## Owner / Auth
Admin-only management (`flash_sales:*` permissions, admin has all). Public read
endpoints (`GET /flash-sales/active`, `GET /flash-sales/:id`).

## Cross-feature contract (source of truth)
`FlashSaleService.getActiveFlashPriceMap(variantIds)` returns the active flash
price + remaining stock per variant. Consumed by:
- **order** — checkout & preview pricing; `consume()` inside the checkout
  transaction (oversell rolls back the order); `reverse()` on cancel.
- **coupon** — prices applicable totals at the flash price so a coupon stacks
  on top of the flash price and preview == checkout.

Module deps: FlashSaleModule → ProductModule (validate variants). OrderModule
and CouponModule → FlashSaleModule. No cycles.

## Status transitions
`FlashSaleScheduler` (@Cron every minute) flips `scheduled→active` and
`*→ended` by time window. `createCampaign`/`updateCampaign` also derive the
status immediately so a campaign is usable without waiting for the tick.
Pricing is time-window driven (not status-only) so a lagging cron never
mis-prices.

## Guards
- Ambiguous-price guard (`FLASH_SALE_005`): a variant cannot be added to a
  campaign overlapping (in time) another campaign that already contains it.
- `flash_quantity` cannot be lowered below `sold_quantity` (`FLASH_SALE_007`).

## Error codes
- FLASH_SALE_001 (404) campaign not found
- FLASH_SALE_002 (404) item not found
- FLASH_SALE_003 (400) ends_at must be after starts_at
- FLASH_SALE_004 (409) variant already in campaign
- FLASH_SALE_005 (400) variant overlaps another campaign
- FLASH_SALE_006 (400) flash item sold out / insufficient quantity
- FLASH_SALE_007 (400) flash_quantity below already-sold
