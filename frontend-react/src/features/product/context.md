# Product Feature

## Purpose
Product catalog browsing (public) and product management (admin). Covers product listing, detail with variants + images, category navigation, and full admin CRUD for products, variants, images, and categories.

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

## API Endpoints

**Public:** `GET /products`, `GET /products/:slug`, `GET /categories`, `GET /categories/:slug`

**Admin:** `GET/POST/PATCH /admin/products`, `PATCH /admin/products/:id/activate`, `POST /admin/products/:id/variants`, `PATCH/DELETE /admin/variants/:id`, `POST /admin/products/:id/images`, `PATCH/DELETE /admin/images/:id`, `GET/POST/PATCH/DELETE /admin/categories`

## State Decisions
- No Zustand store — all product data lives in TanStack Query cache
- URL state for filters/pagination via `usePagination` + `useSearchParams`
- Prefetch product detail on card hover

## Cross-Feature Dependencies
- **auth** — admin guards handled by router (AuthGuard + RoleGuard)
- **cart** — ProductDetailPage has inline add-to-cart button (will import AddToCartButton from cart feature when available)
- **review** — ProductDetailPage can render review list when review feature is built
