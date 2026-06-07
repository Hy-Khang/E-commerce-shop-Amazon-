# Product Feature

## Purpose
Product catalog browsing (public) and product management (admin + seller). Covers product listing, detail with variants + images, category navigation, full admin CRUD, and seller product management.

## Pages

| Page | Route | Auth |
|------|-------|------|
| HomePage | `/` | Public |
| ProductListPage | `/products` | Public |
| ProductDetailPage | `/products/:slug` | Public |
| CategoryPage | `/categories/:slug` | Public |
| AdminProductListPage | `/admin/products` | Admin |
| AdminProductCreatePage | `/admin/products/new` | Admin |
| AdminProductEditPage | `/admin/products/:id/edit` | Admin |
| SellerProductListPage | `/seller/products` | Seller |
| SellerProductCreatePage | `/seller/products/new` | Seller |
| SellerProductEditPage | `/seller/products/:id/edit` | Seller |

## API Endpoints

**Public:** `GET /products`, `GET /products/:slug`, `GET /categories`, `GET /categories/:slug`

**Seller:** `GET /seller/products`, `POST /seller/products`, `GET /seller/products/:id`, `PATCH /seller/products/:id`, `PATCH /seller/products/:id/activate`, `POST/PATCH/DELETE /seller/variants`, `POST/PATCH/DELETE /seller/images`

**Admin:** `GET/POST/PATCH /admin/products`, `PATCH /admin/products/:id/activate`, `POST /admin/products/:id/variants`, `PATCH/DELETE /admin/variants/:id`, `POST /admin/products/:id/images`, `PATCH/DELETE /admin/images/:id`, `GET/POST/PATCH/DELETE /admin/categories`

## State Decisions
- No Zustand store — all product data lives in TanStack Query cache
- URL state for filters/pagination via `usePagination` + `useSearchParams`
- Prefetch product detail on card hover

## Cross-Feature Dependencies
- **auth** — admin/seller guards handled by router (AuthGuard + PortalGuard)
- **shop** — ProductDetailPage shows ShopInfoCard linking to shop profile page
- **cart** — ProductDetailPage has inline AddToCartButton
- **review** — ProductDetailPage renders ReviewList
- **wishlist** — ProductDetailPage and ProductCard render WishlistButton
