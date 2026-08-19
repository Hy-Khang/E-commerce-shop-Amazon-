# Feature: Coupon

## Purpose
Coupon/discount code system for the e-commerce platform. Customers enter coupon codes at checkout to receive discounts. Admins manage coupons with scope-based targeting (entire order, specific categories, or specific products).

## Pages
- **CheckoutPage** (order feature) — CouponInput component integrated into checkout flow
- **AdminCouponListPage** — List all coupons (platform + shop); Owner column + filter; edit only platform coupons, deactivate any
- **AdminCouponCreatePage** — Create platform coupon with scope selection and date range
- **AdminCouponEditPage** — Edit platform coupon details (code immutable), view recent usages
- **SellerCouponListPage** — List the seller's own shop coupons (amber portal)
- **SellerCouponCreatePage** — Create shop coupon (scope all/products, code auto-prefixed with shop slug, own-shop product picker)
- **SellerCouponEditPage** — Edit shop coupon (code immutable), view recent usages

## Shared components
- **CouponForm** — reused by admin & seller; props `hideCategoryScope`, `codePrefix`, `productSource` ('admin' | 'seller')
- **MultiItemPicker** — `source` prop switches products between `useAdminProducts` and `useSellerProducts`

## API Dependencies
- `POST /coupons/validate` — Customer validates coupon code, returns discount info + scope + `shop_id`
- `GET|POST /admin/coupons`, `GET|PATCH|DELETE /admin/coupons/:id`, `GET /admin/coupons/(:id/)usages` — admin (list supports `owner`/`shop_id` filters; platform coupons only for create/edit)
- `GET|POST /seller/coupons`, `GET|PATCH|DELETE /seller/coupons/:id`, `GET /seller/coupons/:id/usages` — seller (shop-scoped, ownership-enforced)

## State Decisions
- **Server state** — TanStack Query for all coupon data (admin CRUD, validation)
- **Form state** — React Hook Form + Zod for coupon creation/editing
- **No global store** — Coupon validation result is local to checkout page, passed via props

## Cross-Feature Integration
- **Order feature** — CouponInput (multi-coupon) rendered in CheckoutPage; the page holds an `AppliedCouponEntry[]` and sends `coupon_codes[]`. CouponInput enforces ≤1 platform + ≤1 per shop client-side (grouped by returned `shop_id`).
- **Order display** — customer OrderDetailPage renders the `applied_coupons[]` breakdown (falls back to `coupon_code`/`discount_amount` for older orders).

## Phase 2 additions
- **Multi-coupon checkout** — stack one platform coupon with one coupon per shop; server computes exact per-shop distribution (FE total is an estimate).
- **Admin lock** — AdminCouponListPage shows a "Locked" badge for `admin_disabled` shop coupons and an Unlock action (`useUnlockCoupon` → `PATCH /admin/coupons/:id/unlock`).
- **Seller lock** — SellerCouponListPage shows "Locked by admin" (no edit/deactivate); SellerCouponEditPage renders a read-only locked notice instead of the form.
