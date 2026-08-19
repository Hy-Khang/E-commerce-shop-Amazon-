# Coupon Feature

## Purpose
Manages discount coupons for the e-commerce platform. Two ownership kinds:
- **Platform coupons** (`shop_id = NULL`) — created/managed by admins via `/admin/coupons`. Scope: all / categories / products.
- **Shop coupons** (`shop_id` set) — created/managed by sellers via `/seller/coupons`, discount only the owning shop's items. Scope limited to all / products.

## Entities
- **coupons** — Core coupon definition (code, discount type/value, scope, limits, validity dates, `shop_id`)
- **coupon_categories** — Junction table linking coupons to categories (scope = 'categories', platform only)
- **coupon_products** — Junction table linking coupons to products (scope = 'products')
- **coupon_usages** — Audit trail of coupon usage per user per order

## Dependencies
- **Category entity** (read-only) — for sub-tree matching when scope = 'categories'
- **Product entity** (read-only) — validates that `product_ids` belong to the seller's shop
- **CartItem entity** (read-only) — consumed by OrderService during checkout
- **ShopModule / ShopService** — resolves the seller's shop, enforces shop-active validity

## Consumed by
- **OrderModule** — imports CouponModule to validate and apply coupons during checkout, and reverse usage on order cancellation

## Design Decisions
- `min_order_amount` checks against applicable items total, not entire cart
- Category scope includes all sub-categories (recursive parent_id traversal)
- Coupon usage reversal uses `status = 'reversed'` for audit trail, not hard delete
- Race conditions handled via optimistic locking (atomic `current_uses` increment with WHERE guard)
- `coupon_code` and `discount_amount` are snapshotted on the `orders` table (code only on sub-orders that actually got a discount)
- **Shop coupons:** code is prefixed with the shop slug (globally unique), only valid while the shop is `active` (else `COUPON_006`). Ownership enforced on every seller read/mutation (`COUPON_010`); product scope validated against the shop (`COUPON_009`). Admins may view + deactivate but not edit shop coupons.
- **Applicable-by-shop:** `getApplicableTotalsByShop` returns per-shop applicable subtotals honouring scope and (for shop coupons) the owning shop. Checkout uses it to route a shop coupon's discount to its own sub-order, or split a platform coupon across shops by applicable subtotal (largest-remainder rounding).
- **Reversal:** shop-coupon usage reverses as soon as its sub-order is cancelled; platform-coupon usage reverses only when all group orders are cancelled. Both idempotent (conditional `status='applied'` flip)
- **Multi-coupon checkout (Phase 2):** `validateAndCalculateDiscounts(userId, codes[], cartItems)` validates each code, enforces ≤1 platform + ≤1 per shop (`COUPON_011`), and returns one `ICouponCalculationItem` per coupon (each calculated independently on the original subtotal). OrderService routes each shop coupon to its own sub-order and splits the platform coupon across shops, filling only the headroom left after a shop coupon. `getUsagesForOrder(orderId)` feeds the order-detail `applied_coupons[]` breakdown.
- **Admin lock (`admin_disabled`, Phase 2):** admin `DELETE` on a shop coupon sets the sticky `admin_disabled` flag; `unlockCoupon` clears it and reactivates. A locked coupon validates as inactive (`COUPON_006`) and the seller's `updateSellerCoupon` rejects it (`COUPON_013`). Platform coupons never set the flag.
