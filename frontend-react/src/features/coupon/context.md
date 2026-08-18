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
- **Order feature** — CouponInput component rendered in CheckoutPage; coupon_code sent in checkout request
- **Order display** — Order detail pages show coupon_code and discount_amount from order response
