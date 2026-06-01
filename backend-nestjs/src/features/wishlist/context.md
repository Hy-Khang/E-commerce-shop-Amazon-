# Wishlist Feature

## Purpose
Allow customers to save products for later purchase. Links to products (not variants) following the Amazon model.

## Owned Entities
- `wishlist_items` — user_id + product_id with unique constraint, tracks when product was added

## Dependencies
- ProductModule — verify product exists and is active when adding to wishlist
