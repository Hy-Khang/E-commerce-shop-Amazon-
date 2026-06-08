# Order Feature

## Purpose
Checkout from cart, order history, order detail, cancel pending orders, admin order management (status + payment updates).

## Pages
- `CheckoutPage` — address selection, payment method, place order
- `OrderHistoryPage` — paginated list of user's orders
- `OrderDetailPage` — order info + order items (with shop name snapshots) + cancel action
- `AdminOrderListPage` — all orders with status/payment filters
- `AdminOrderDetailPage` — admin view with status transition + payment controls
- `SellerOrderListPage` — seller's orders filtered by their shop (status/payment filters)
- `SellerOrderDetailPage` — seller view with own items only + confirm/ship actions

## API Dependencies
- `POST /orders` — checkout (creates order from cart)
- `GET /orders` — list my orders
- `GET /orders/:id` — order detail
- `PATCH /orders/:id/cancel` — cancel pending order
- `GET /addresses` — load addresses for checkout
- `GET /admin/orders` — admin list all orders
- `GET /admin/orders/:id` — admin order detail
- `PATCH /admin/orders/:id/status` — admin update status
- `PATCH /admin/orders/:id/payment-status` — admin update payment
- `GET /seller/orders` — seller list orders containing their products
- `GET /seller/orders/:id` — seller order detail (only their items shown)
- `PATCH /seller/orders/:id/status` — seller update status (pending→confirmed, confirmed→shipping)

## State
- Server state via TanStack Query (staleTime: 1 min)
- No Zustand store needed

## Cross-Feature
- Checkout success invalidates `['cart']` + `['orders', 'list']` cache
- Uses `cartKeys` from `@/features/cart` for cache invalidation
- Uses `useCart` from `@/features/cart` for checkout item preview
- Loads addresses via `/addresses` endpoint (self-contained until user-profile is built)
- Review feature needs `order_id` for purchase verification
