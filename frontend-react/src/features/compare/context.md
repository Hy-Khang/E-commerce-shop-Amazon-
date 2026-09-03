# Feature: Compare (Product Comparison — Module 19)

## Purpose
Lets a customer pick up to **4 products of the same category** and compare them
side-by-side (price range, rating, category, shop, variant options, stock), with a
floating comparison bar and an add-to-cart shortcut. Frontend-only — no DB.

## Pages
- `pages/ComparePage.tsx` (`/compare`, public) — side-by-side table with a sticky
  attribute column + one column per product. Reuses `AddToCartButton` (single-variant)
  or links to detail (multi-variant). Empty state when nothing is selected.

## Components
- `CompareToggleButton` — "So sánh" toggle overlaid on `ProductCard` (inside its `<Link>`,
  stops propagation). Remove is always allowed; adding a different-category / 5th product
  is refused with a toast.
- `CompareBar` — floating bar mounted once in `MainLayout` (like `AiChatWidget`); thumbnail
  slots + "So sánh (n)" → `/compare` + "Xóa tất cả". Hidden when empty. `z-50`.
- `RatingStars` — local 5-star row (no shared star component in the repo).

## State
- `stores/compare.store.ts` — Zustand + `persist` (`compare_candidates`). Holds
  `{ product_id, category_id }[]`, cap `MAX_COMPARE = 4`, same-category lock in `add`.
  Keeps a stable array reference (Zustand v5 snapshot rule).
- `hooks/useCompare.ts` — derives ids (useMemo), hydrates via the catalog, and **reconciles**
  the store on a successful fetch (prunes ids the server dropped — inactive product / suspended
  shop). Guarded so a transient error never wipes the store.

## API deps
- `GET /products?ids=1,2,3` (public bulk) — returns each product with `avgRating`,
  `reviewCount`, and the joined `category`. Same endpoint as Recently-Viewed guest hydration.

## Cross-feature
- Reads `ProductCard`, price/stock utils, and `ProductListItem` from `@/features/product`.
- Reuses `AddToCartButton` from `@/features/cart`.
- Wired into `ProductCard` (toggle) and `MainLayout` (bar); route in `core/router`.
