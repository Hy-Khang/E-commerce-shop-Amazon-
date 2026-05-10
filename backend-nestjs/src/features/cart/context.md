# Cart Feature

## Purpose
Shopping cart for authenticated users and guests (via session_id).

## Owned Entities
- `carts` — nullable user_id for guest support, session_id for guest identification
- `cart_items` — FK to product_variants, eager-loads variant info for display

## Dependencies
- **ProductModule** — injects ProductService for variant validation and stock check
- Auth handled globally via JwtAuthGuard (no direct AuthModule import needed)

## Consumed By
- **OrderModule** — calls `getCartWithItems(userId)` at checkout, `clearCart(userId)` after success

## Key Design Decisions
- **Customer or Guest auth:** Endpoints use `@Public()` with optional JWT. User identified by JWT `user_id` or `X-Session-Id` header. Modified `JwtAuthGuard` attempts auth on public routes without blocking.
- **Cart merge:** On login, guest cart items are merged into user cart (same variant → sum quantities), then guest cart is deleted.
- **Stock validation:** Checked on addItem and updateItem — CART_003 (out of stock), CART_004 (exceeds stock).
- **Response mapping:** Raw entities mapped via `toCartResponse()` util to include variant + product details.
- **Empty cart:** `getCart` returns `{ id: 0, items: [] }` instead of 404 when no cart exists.
