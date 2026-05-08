# Review Feature

## Purpose
Purchase-verified reviews: create review for delivered orders, view product reviews, manage my reviews.

## Pages
- Reviews are rendered inline on ProductDetailPage (not a standalone page)
- `MyReviewsPage` (future) — list user's reviews

## API Dependencies
- `POST /reviews` — create review (purchase-verified via order_id)
- `GET /products/:productId/reviews` — list reviews for a product
- `GET /reviews/me` — list my reviews
- `DELETE /reviews/:id` — delete own review

## State
- Server state via TanStack Query (staleTime: 1min)
- No Zustand store needed

## Cross-Feature
- Depends on order: needs order_id + product_id for verification
- Renders on product detail page
- Creating review invalidates product reviews cache
