# Order Feature

## Purpose
Checkout from cart, order history, order detail, cancel pending orders, admin order management (status + payment updates).

## Pages
- `CheckoutPage` — address selection, payment method, place order. Items are **grouped by shop** (`CheckoutShopGroup`, mirroring the Cart page): each shop card carries a read-only item list + a shop-voucher row, and a platform-voucher row sits in the "Platform Voucher" card. One scoped `CouponSelectorModal` serves the platform row and every shop group; selection lives in the shared `useAppliedCouponsStore`, so choices made on the Cart page carry over and stay editable.

## Components
- `CheckoutShopGroup` — one shop's items on checkout (shop header + read-only `OrderItemRow`s + a `VoucherRow` for its shop coupon). Presentational mirror of the cart's `CartShopGroup` (no quantity controls). Reuses `groupItemsByShop` from `@/features/cart` and `VoucherRow` from `@/features/coupon`.
- `OrderHistoryPage` — paginated list of user's orders
- `OrderDetailPage` — order info + order items (with shop name snapshots) + cancel action
- `AdminOrderListPage` — all orders with status/payment filters
- `AdminOrderDetailPage` — admin view with status transition + payment controls
- `SellerOrderListPage` — seller's orders filtered by their shop (status/payment filters)
- `SellerOrderDetailPage` — seller view with own items only + confirm/ship actions

## API Dependencies
- `POST /orders` — checkout (creates order from cart)
- `POST /orders/preview` — advisory checkout estimate (exact coupon breakdown, no writes)
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
- **Checkout preview (Phase 3):** `usePreviewCheckout(codes, cartSig, enabled)` calls `POST /orders/preview`. It runs whenever the cart is non-empty (`enabled = hasCartItems`) — even with **no** coupon — so the summary shows the server's exact per-shop shipping instead of "calculated after order". Query key includes a cart signature (`variant:qty:price`) so changing items/quantities refetches. CheckoutPage prefers the server preview for discount/shipping/total; when the cart spans >1 shop it also renders `CheckoutShopBreakdown` (per-shop items/discount/shipping/subtotal, mirroring the N-orders split). A coupon rejected by preview surfaces an error; only a **coupon-level** rejection (`COUPON_0xx`, via `ApiError.code`) disables "Place Order" — a transient/network error does not (checkout re-validates). Preview is advisory — checkout re-validates and is the source of truth.

## Cross-Feature
- Checkout success invalidates `['cart']` + `['orders', 'list']` cache
- Uses `cartKeys` from `@/features/cart` for cache invalidation
- Uses `useCart` from `@/features/cart` for checkout item preview
- Loads addresses via `/addresses` endpoint (self-contained until user-profile is built)
- Review feature needs `order_id` for purchase verification
- **Payment integration**: CheckoutPage imports `useCreatePayment` from `@/features/payment` — after creating order with VNPay/MoMo, calls POST /payments/create then redirects to gateway URL
- **Payment retry**: OrderDetailPage imports `useCreatePayment` + `PaymentTransactionList` from `@/features/payment` — shows "Pay Now" button for unpaid online orders and transaction history
- **Admin transactions**: AdminOrderDetailPage shows `PaymentTransactionList` for non-COD orders
