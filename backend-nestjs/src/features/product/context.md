# Product Feature

## Purpose
Manages the product catalog: categories, products, variants, and images. Serves as the stock owner and central reference for cart, order, and review features.

## Owned Entities
- `categories` — self-referencing hierarchy (parent_id)
- `products` — main product records with soft-delete via is_active
- `product_variants` — SKU/color/size/price/stock per variant (transaction hub)
- `product_images` — multiple images per product with sort ordering

## Controllers
- `ProductController` — public endpoints (GET /products, /categories)
- `AdminProductController` — admin CRUD for products, variants, images
- `AdminCategoryController` — admin CRUD for categories

## Cross-Feature Dependencies
- **Exports:** `ProductService` (consumed by cart, order, review modules)
- **Listens to:** `order.created` (deduct stock), `order.cancelled` (restore stock)
- **No imports** from other feature modules

## Key Decisions
- Variants are the transaction hub — cart_items and order_items FK to product_variants, not products
- Stock deduction uses optimistic locking (atomic UPDATE with WHERE stock_quantity >= qty)
- Products use eager loading for variants and images (always needed for display)
- Categories support N-level nesting via self-referencing parent_id
