# Cart Feature

## Purpose
Shopping cart: view items, add/update/remove items, guest cart via session_id, merge guest cart on login.

## Pages
- `CartPage` — cart items list, quantity controls, subtotal, checkout button

## Components
- `CartItemList` — renders list of cart item rows
- `CartItemRow` — single item: variant info, quantity +/-, remove button
- `CartSummary` — subtotal, shipping note, checkout + continue shopping buttons
- `CartBadge` — header cart icon with item count badge (from Zustand store)
- `AddToCartButton` — reusable button exported for product detail page
- `CartPageSkeleton` — loading skeleton for cart page

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
