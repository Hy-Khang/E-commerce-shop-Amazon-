# Cart Feature

## Purpose
Shopping cart for authenticated users and guests (via session_id).

## Owned Entities
- `carts` — nullable user_id for guest support
- `cart_items` — FK to product_variants

## Dependencies
- AuthModule — user identity
- ProductModule — variant validation and stock check

## Consumed By
- OrderModule — reads cart at checkout, clears after
