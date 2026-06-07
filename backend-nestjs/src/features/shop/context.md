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
