# Product Feature

## Purpose
Product catalog: listing with filters/pagination, product detail with variants and images, category tree navigation, and admin CRUD.

## Pages
- `HomePage` — featured products
- `ProductListPage` — paginated, filtered, sorted product grid
- `ProductDetailPage` — full product info, variant selection, images, reviews
- `CategoryPage` — products filtered by category
- `AdminProductListPage` — admin product management
- `AdminProductCreatePage` — create new product with variants
- `AdminProductEditPage` — edit product, manage variants and images

## API Dependencies
- `GET /products` — list (paginated, filtered)
- `GET /products/:slug` — detail with variants + images
- `GET /categories` — category tree
- `GET /categories/:slug` — category with products
- Admin: `POST /products`, `PATCH /products/:id`, `PATCH /products/:id/activate`
- Admin: `POST /products/:id/variants`, `PATCH /variants/:id`
- Admin: `POST /products/:id/images`, `PATCH /images/:id`, `DELETE /images/:id`

## State
- Server state via TanStack Query (staleTime: 5min for products/categories)
- URL params for filters: category_id, min_price, max_price, search, page, sort

## Cross-Feature
- Cart uses ProductVariant type for add-to-cart
- Review renders on ProductDetailPage
- Prefetch product detail on ProductCard hover
