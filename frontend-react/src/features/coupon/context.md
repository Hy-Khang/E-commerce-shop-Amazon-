# Feature: Coupon

## Purpose
Coupon/discount code system for the e-commerce platform. Customers enter coupon codes at checkout to receive discounts. Admins manage coupons with scope-based targeting (entire order, specific categories, or specific products).

## Pages
- **CheckoutPage** (order feature) — CouponInput component integrated into checkout flow
- **AdminCouponListPage** — List all coupons with search, filter by scope/status, pagination
- **AdminCouponCreatePage** — Create new coupon with scope selection and date range
- **AdminCouponEditPage** — Edit coupon details (code is immutable), view recent usages

## API Dependencies
- `POST /coupons/validate` — Customer validates coupon code, returns discount info + scope
- `GET /admin/coupons` — Admin list coupons (paginated, filterable)
- `GET /admin/coupons/:id` — Admin coupon detail
- `POST /admin/coupons` — Admin create coupon
- `PATCH /admin/coupons/:id` — Admin update coupon (code immutable)
- `DELETE /admin/coupons/:id` — Admin soft-delete (set is_active = false)
- `GET /admin/coupons/usages` — Admin list all coupon usages
- `GET /admin/coupons/:id/usages` — Admin list usages for specific coupon

## State Decisions
- **Server state** — TanStack Query for all coupon data (admin CRUD, validation)
- **Form state** — React Hook Form + Zod for coupon creation/editing
- **No global store** — Coupon validation result is local to checkout page, passed via props

## Cross-Feature Integration
- **Order feature** — CouponInput component rendered in CheckoutPage; coupon_code sent in checkout request
- **Order display** — Order detail pages show coupon_code and discount_amount from order response
