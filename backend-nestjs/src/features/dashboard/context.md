# Dashboard Feature

## Purpose
Provides aggregated analytics for admin and seller dashboards — summary stats, revenue trends, order distribution, top products, and low stock alerts.

## Entities
None owned. Queries across: `orders`, `order_items`, `users`, `roles`, `products`, `product_variants`, `shops`.

## Endpoints
- `GET /admin/dashboard` — returns all admin dashboard sections via `Promise.allSettled()` (partial failure safe)
- `GET /seller/dashboard` — returns seller-specific analytics scoped to their shop's products

## Dependencies
- `Order` entity (registered for TypeORM, used for `this.repo.manager` cross-table queries)
- `ShopModule` — seller dashboard resolves `userId → shopId` via `ShopService.resolveShopByUserId()` before querying

## Design Decisions
- Single endpoint returns all dashboard data to minimize frontend round-trips
- `Promise.allSettled()` ensures one failing query doesn't break the entire dashboard
- All raw SQL isolated in `DashboardRepository` — only file affected by DB vendor change
- Revenue/top products filter `payment_status = 'paid' AND status != 'cancelled'`
- Seller queries filter by `products.shop_id` (not `seller_id`) — joined through shops table
- User counts filter `is_active = 1`
- Dates stored/returned in UTC — frontend converts to local timezone
