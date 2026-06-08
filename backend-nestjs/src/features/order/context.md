# Order Feature

## Purpose
Checkout, order creation with immutable snapshots, status management.

## Owned Entities
- `orders` — status, payment, shipping address (JSON snapshot), coupon snapshots
- `order_items` — immutable snapshots of product data at purchase time, including shop_id + shop_name snapshots

## Dependencies
- AuthModule — user identity
- CartModule — read cart at checkout
- ProductModule — validate stock, snapshot product data (including shop info)
- ShopModule — resolve seller's shop for seller order endpoints

## Events Emitted
- `order.created` — triggers stock deduction in ProductModule
- `order.cancelled` — triggers stock restoration in ProductModule

## Consumed By
- ReviewModule — verifies purchase for review eligibility
