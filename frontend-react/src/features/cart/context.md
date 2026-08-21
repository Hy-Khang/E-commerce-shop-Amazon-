# Cart Feature

## Purpose
Shopping cart: view items, add/update/remove items, guest cart via session_id, merge guest cart on login.

## Pages
- `CartPage` — cart items list, quantity controls, subtotal, checkout button

## Components
- `CartShopGroup` — one shop's items as a card (shop header + item rows + a shop-voucher row for logged-in customers)
- `CartItemRow` — single item: variant info, quantity +/-, remove button (self-contained; rendered inside `CartShopGroup`)
- `CartSummary` — subtotal, platform-voucher row, advisory discount estimate, checkout + continue shopping buttons
- `CartBadge` — header cart icon with item count badge (from Zustand store)
- `AddToCartButton` — reusable button exported for product detail page
- `CartPageSkeleton` — loading skeleton for cart page

## Voucher selection on the Cart page (Shopee-inspired, own theme)
- Cart items are grouped by shop (`groupItemsByShop`); each shop card carries a shop-voucher row, and the summary carries a platform-voucher row.
- Selection lives in `useAppliedCouponsStore` (feature `coupon`) — shared with Checkout so choices carry over and stay editable. Cleared on successful order.
- Voucher UI is gated on `useAuthStore().isAuthenticated` — the coupon APIs need a logged-in customer; guests still see the shop grouping.
- The Cart shows only an **advisory** discount estimate (`estimateCouponDiscount`, per-coupon on the original subtotal). The exact figure (incl. the platform waterfall) is confirmed by `POST /orders/preview` / checkout — the Cart never imports order/preview.
- `reconcile` (effect keyed on the cart signature) prunes shop coupons whose shop left the cart and clears all when empty.

## API Dependencies
- `GET /cart` — current cart with items + variant details
- `POST /cart/items` — add item (product_variant_id + quantity)
- `PATCH /cart/items/:id` — update quantity
- `DELETE /cart/items/:id` — remove item
- `POST /cart/merge` — merge guest cart into user cart on login

## State
- Server state via TanStack Query (staleTime: 0 — always fresh)
- `useCartStore` (Zustand) — global itemCount for header badge
- Guest session_id in localStorage

## Cross-Feature
- Auth triggers cart merge on login
- Order reads cart at checkout
- Product detail page uses AddToCartButton
- Optimistic updates on add/update/remove with rollback on error
