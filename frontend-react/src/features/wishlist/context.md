# Wishlist Feature

## Purpose
Save products to wishlist for later purchase. Toggle heart icon on product cards/detail, view saved items, admin analytics for popular products.

## Pages
- `WishlistPage` — paginated list of wishlisted products with remove button (AuthGuard)
- `AdminWishlistPopularPage` — most wishlisted products ranked by count (RoleGuard)

## Components
- `WishlistButton` — heart toggle button, exported via barrel for product detail/cards
- `WishlistItemCard` — single wishlist item with product info, price, remove action

## API Dependencies
- `POST /wishlist` — add product to wishlist
- `DELETE /wishlist/:productId` — remove product from wishlist
- `GET /wishlist` — list my wishlist (paginated)
- `GET /wishlist/check/:productId` — check single product
- `POST /wishlist/check` — bulk check multiple products
- `GET /admin/wishlist/popular` — most wishlisted products (admin)

## State
- Server state via TanStack Query (staleTime: 1min)
- No Zustand store — wishlist count not shown in header badge

## Cross-Feature
- WishlistButton used on ProductDetailPage and ProductCard
- Single check via `useCheckWishlist(productId)` on product detail
- Bulk check via `useBulkCheckWishlist(productIds[])` on product listings
- Non-authenticated users: WishlistButton redirects to login
- Deactivated products remain in wishlist, shown as "Unavailable"
