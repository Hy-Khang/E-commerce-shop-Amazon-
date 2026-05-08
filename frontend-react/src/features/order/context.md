# Order Feature

## Purpose
Checkout from cart, order history, order detail, admin order management (status + payment updates).

## Pages
- `CheckoutPage` — address selection, payment method, place order
- `OrderHistoryPage` — paginated list of user's orders
- `OrderDetailPage` — order info + order items
- `AdminOrderListPage` — all orders with filters
- `AdminOrderDetailPage` — admin view with status/payment controls

## API Dependencies
- `POST /orders` — checkout (creates order from cart)
- `GET /orders` — list my orders
- `GET /orders/:id` — order detail
- `PATCH /orders/:id/cancel` — cancel pending order
- `GET /admin/orders` — admin list all orders
- `PATCH /orders/:id/status` — admin update status
- `PATCH /orders/:id/payment-status` — admin update payment

## State
- Server state via TanStack Query (staleTime: 1min)
- No Zustand store needed

## Cross-Feature
- Checkout success invalidates cart + orders cache
- Reads addresses from user-profile for checkout
- Review feature needs order_id for purchase verification
