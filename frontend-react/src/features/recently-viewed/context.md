# Recently Viewed — context (frontend)

## Purpose
Module 18. Tracks products the user views and shows a "Recently Viewed" carousel on the Home, Product Detail, and Cart pages. Guests are tracked in localStorage; customers in the DB. On login the guest list is merged into the DB, then cleared.

## Public exports (barrel)
- `RecentlyViewedCarousel` — the carousel (accepts `excludeProductId`).
- `useTrackView(productId)` — fire on product-detail load.
- `useRecentlyViewed()` — `{ products, isLoading }`.
- `useMergeRecentlyViewed()` — merge mutation used by the auth login flows.
- `useRecentlyViewedStore` — guest Zustand store (persisted).

## State / API decisions
- **Guest**: Zustand `persist` store (`recently_viewed` key) holds `{ product_id, viewed_at }[]` (newest first, cap 20). The carousel hydrates fresh product data via `GET /products?ids=` (no stale snapshot).
- **Customer**: `GET /recently-viewed` (already ordered), `POST /recently-viewed` to record, `POST /recently-viewed/merge` on login.
- Both paths yield `ProductListItem[]`, so the carousel renders both with the same `ProductCard`.
- `useTrackView` fires once per productId change: authenticated → DB (best-effort, invalidates the query); guest → store.
- Merge is wired into `useLogin`, `useVerifyEmail`, and `OAuthCallbackPage` alongside the existing cart merge.

## Dependencies
- `@/features/product` (ProductCard, ProductCardSkeleton, ProductListItem), `@/features/auth` (isAuthenticated).
