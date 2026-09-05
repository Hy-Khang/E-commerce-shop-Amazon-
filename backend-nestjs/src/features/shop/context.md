# Shop Feature

## Purpose
Gives each seller a storefront identity (name, logo, description, banner, slug) separate from their user account. Surfaces shop info on product detail pages and provides a public shop profile page.

## Entities
- `shops` — 1:1 with `users` (seller role). Status lifecycle: `pending_verification` → `active` → `suspended`/`banned`.

## Dependencies
- **AuthModule** — `users` table (FK: `user_id`, `verified_by`)
- **Consumed by:** ProductModule (resolves shop for seller product operations), DashboardModule (resolves shop for seller analytics)

## Design Decisions
- **Status over is_active:** 4-state lifecycle (`pending_verification`, `active`, `suspended`, `banned`) instead of boolean, with moderation timestamps (`verified_at`, `verified_by`, `suspended_at`, `banned_at`).
- **Slug immutable:** Cannot be changed after creation to prevent broken links.
- **Separated helpers:** `resolveShopByUserId()` (no status check) vs `assertShopIsActive()` — suspended sellers can still view/edit their shop but cannot create/publish products.
- **No SHOPS_DELETE permission:** Shops are never deleted, only status-transitioned.

## Shop Decoration (Module 26)
- **Column:** `shops.decoration_config` (NVARCHAR(MAX), nullable) — a versioned JSON envelope `{ version, theme?, blocks[] }` for the block-based storefront builder. Raw string column + manual `JSON.stringify`/`JSON.parse` in the service (repo JSON convention), not a TypeORM transformer.
- **Reuses existing endpoints** — write via `PATCH /seller/shop` (`decoration_config` on `UpdateShopDto`), read via `GET /shops/:slug` + `GET /seller/shop`. No new endpoints/tables.
- **Validation:** `dto/decoration-config.dto.ts` — nested class-validator DTOs + a custom `@ValidatorConstraint` (`IsBlockData`) that validates `block.data` against the DTO matching the sibling `block.type` (discriminator can't reach a sibling field; repo precedent is `common/validators/is-image-path`). Limits: ≤20 blocks, unique ids, hero 1–5 images, grid 1–12 unique ids; serialized ≤16 KB enforced in `updateMyShop` → `SHOP_006`.
- **Read/write mapping:** `ShopService.withParsedDecoration()` parses the column to an object (malformed → null, defensive) for `findShopBySlug`/`getMyShop`/`updateMyShop`. `resolveShopByUserId()` (the DI helper other features use) still returns the raw entity — decoration parsing is only on the seller/public-facing paths.
- **Extensible:** add a `video` block later via one entry in `BLOCK_TYPES` + `BLOCK_DATA_DTOS` — no column/endpoint change.
