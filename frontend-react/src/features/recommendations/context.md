# Recommendations Feature (Module 22 — Smart Recommendations)

Storefront personalization surfaces + behavioral signal tracking. Guest + customer
(JWT / `x-session-id` auto-attached by the axios interceptor — zero extra wiring).

## Components (carousels)
All share `RecommendationCarousel` (the scroll/snap/chevron/skeleton shell copied from
`RecentlyViewedCarousel`, reusing `ProductCard`/`ProductCardSkeleton`). Each renders nothing
when empty. Titles are **hardcoded English** (no i18n framework in the app).
- `RecommendedForYouCarousel` — Home + Cart. Shows the `reason` as a subtitle when present.
- `SimilarProductsCarousel` — Product Detail (replaced the old `RelatedProducts` grid).
- `FrequentlyBoughtTogetherCarousel` — Product Detail (near the buy-box).

## Hooks
- `useRecommendedForYou(limit)` → `{ products, reason, isLoading }` (`GET /recommendations`).
- `useSimilarProducts(productId, limit)` / `useFrequentlyBoughtTogether(productId, limit)`.
- `useTrackActivity(signal?)` — fires `POST /activity` once per distinct `action:target_id`
  on mount/change (fire-once ref guard like `useTrackView`). Used for VIEW_PRODUCT (detail
  page) and VIEW_CATEGORY (category page).
- `useTrackActivityCallback()` — imperative tracker for event-driven signals: SEARCH
  (list page, on keyword change), ADD_TO_CART (`AddToCartButton`, opt-in via `productId` prop),
  ADD_TO_WISHLIST (`WishlistButton`). All best-effort — failures are swallowed.

## Notes
- Responses are the same **product-list-item** shape as `GET /products`, so no card changes.
- All activity tracking is best-effort and never surfaced to the user (`.catch(() => {})`).
- ADD_TO_CART is tracked only where the product id is known (product detail) — the shared
  `AddToCartButton` takes an optional `productId` prop; cart-page quantity tweaks are skipped.
