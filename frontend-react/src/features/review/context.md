# Review Feature

## Purpose
Purchase-verified reviews: create review for delivered orders, view product reviews, manage my reviews, admin moderation.

## Pages
- Reviews rendered inline on ProductDetailPage via `ReviewList` component
- `MyReviewsPage` — list user's reviews with delete (AuthGuard)
- `AdminReviewListPage` — admin review moderation with filters (RoleGuard)

## API Dependencies
- `POST /reviews` — create review (purchase-verified via order_id)
- `GET /products/:productId/reviews` — list reviews for a product
- `GET /reviews/me` — list my reviews
- `DELETE /reviews/:id` — delete own review
- `GET /admin/reviews` — list all reviews (admin)
- `DELETE /admin/reviews/:id` — delete any review (admin)

## State
- Server state via TanStack Query (staleTime: 1min)
- No Zustand store needed

## Cross-Feature
- Depends on order: needs order_id + product_id for verification
- Renders on product detail page via ReviewList
- Creating review invalidates product reviews cache
- ReviewForm receives productId + orderId as props
