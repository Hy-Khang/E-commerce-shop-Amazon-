# Seller Application (Module 24 — Seller Onboarding)

## Purpose
Lets a customer apply to become a seller. Admin reviews a moderation queue;
approving grants the `seller` role + materializes an **active** shop.

## Entities
- `seller_applications` — one application per user; filtered-UNIQUE `(user_id) WHERE status='pending'`
  (at most one pending; rejected rows kept for audit + allow re-apply). Fields: shop_name, phone,
  business_name, tax_id, description, logo_url, banner_url, reject_reason, reviewed_by/at.

## Endpoints
- Customer: `POST /seller-applications` (apply), `GET /seller-applications/me` (latest, null if none).
- Admin (`seller_applications:read/update`): `GET /admin/seller-applications` (paginated, `?status=`),
  `GET /admin/seller-applications/:id`, `PATCH .../:id/approve`, `PATCH .../:id/reject`.

## Dependencies (cross-feature via DI)
- `AuthService.resolveRoleIdByName('seller')` + `AuthService.changeUserRole` — grant role (AuthModule is global).
- `ShopService.createShopFromApplication` — create the shop `active` + `verified_at/by` (skips
  `pending_verification`; the application review IS the vetting). Reuses the 1:1 SHOP_002 guard.

## Design notes
- Approve is sequential (not a cross-service DB txn — the codebase has no such pattern): shop created
  first (reused if it already exists), then role granted, then application marked approved → safe to retry.
- After approval the user's current JWT still carries the old role until refreshed — the FE refreshes the
  token + profile before entering the Seller Center (`useEnterSellerCenter`).
- Errors: `SELLER_APP_001` (404), `_002` (409 already seller), `_003` (409 pending exists), `_004` (400 not pending).
