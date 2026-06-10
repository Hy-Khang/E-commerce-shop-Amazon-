# Order Feature

## Purpose
Checkout, order creation with immutable snapshots, status management, customer confirmation flow, auto-completion.

## Owned Entities
- `orders` — status, payment, shipping address (JSON snapshot), coupon snapshots, `delivered_at` timestamp
- `order_items` — immutable snapshots of product data at purchase time, including shop_id + shop_name snapshots

## Status Flow
```
pending → confirmed → shipping → delivered
                                   ├─ customer confirm receipt → completed (terminal)
                                   ├─ customer return request  → return_requested
                                   │     ├─ admin approve → cancelled
                                   │     └─ admin reject  → completed
                                   └─ auto-complete (7 days) → completed
```

**Transition ownership:**
- **Customer:** `pending → cancelled`, `delivered → completed`, `delivered → return_requested`
- **Admin:** `pending → confirmed/cancelled`, `confirmed → shipping/cancelled`, `shipping → delivered/cancelled`, `delivered → completed`, `return_requested → completed/cancelled`
- **Seller:** `pending → confirmed → shipping → delivered` (unchanged, stops at delivered)

## Dependencies
- AuthModule — user identity
- CartModule — read cart at checkout
- ProductModule — validate stock, snapshot product data (including shop info)
- ShopModule — resolve seller's shop for seller order endpoints, resolve seller user IDs for notifications

## Events Emitted
- `order.created` — triggers stock deduction in ProductModule
- `order.cancelled` — triggers stock restoration in ProductModule
- `order.status_updated` — triggers notification creation (payload includes `notifyUserIds[]`)

## Scheduler
- `OrderScheduler` — hourly cron auto-completes orders in `delivered` status with `delivered_at` older than 7 days

## Consumed By
- ReviewModule — verifies purchase for review eligibility (requires `completed` status)
- DashboardModule — revenue queries use `completed` status
