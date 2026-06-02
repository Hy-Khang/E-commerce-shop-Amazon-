# Coupon Feature

## Purpose
Manages discount coupons for the e-commerce platform. Supports three scope types: all items, specific categories (including sub-categories), and specific products.

## Entities
- **coupons** — Core coupon definition (code, discount type/value, scope, limits, validity dates)
- **coupon_categories** — Junction table linking coupons to categories (scope = 'categories')
- **coupon_products** — Junction table linking coupons to products (scope = 'products')
- **coupon_usages** — Audit trail of coupon usage per user per order

## Dependencies
- **Category entity** (read-only) — for sub-tree matching when scope = 'categories'
- **CartItem entity** (read-only) — consumed by OrderService during checkout

## Consumed by
- **OrderModule** — imports CouponModule to validate and apply coupons during checkout, and reverse usage on order cancellation

## Design Decisions
- `min_order_amount` checks against applicable items total, not entire cart
- Category scope includes all sub-categories (recursive parent_id traversal)
- Coupon usage reversal uses `status = 'reversed'` for audit trail, not hard delete
- Race conditions handled via optimistic locking (atomic `current_uses` increment with WHERE guard)
- `coupon_code` and `discount_amount` are snapshotted on the `orders` table
