# Order Feature

## Purpose
Checkout, order creation with immutable snapshots, status management.

## Owned Entities
- `orders` — status, payment, shipping address (JSON snapshot)
- `order_items` — immutable snapshots of product data at purchase time

## Dependencies
- AuthModule — user identity
- CartModule — read cart at checkout
- ProductModule — validate stock, snapshot product data

## Events Emitted
- `order.created` — triggers stock deduction in ProductModule
- `order.cancelled` — triggers stock restoration in ProductModule

## Consumed By
- ReviewModule — verifies purchase for review eligibility
