# Product Feature

## Purpose
Product catalog management — categories, products, variants, images.

## Owned Entities
- `categories` — self-referencing hierarchy (N-level)
- `products` — catalog items with SEO slugs
- `product_variants` — transaction hub (color/size/price/stock per variant)
- `product_images` — product gallery with sort order

## Dependencies
None (direct module imports).

## Events Listened
- `order.created` — deduct stock (optimistic lock)
- `order.cancelled` — restore stock

## Consumed By
- cart, order, review — import ProductModule for stock validation and product data
