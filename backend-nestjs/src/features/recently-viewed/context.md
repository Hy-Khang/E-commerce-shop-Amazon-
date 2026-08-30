# Recently Viewed — context

## Purpose
Module 18. Tracks and returns the products a **customer** has recently viewed (max 20, newest first). Guests are handled entirely on the frontend (localStorage); their history is merged into the DB on login.

## Entities
- `recently_viewed` (`RecentlyViewed`) — `id, user_id, product_id, viewed_at`. UNIQUE `(user_id, product_id)` so a re-view **touches** `viewed_at` instead of duplicating. Indexes: `idx_recently_viewed_user_id`, `idx_recently_viewed_user_viewed (user_id, viewed_at)`.

## Endpoints (all Customer-only, JWT)
- `GET /recently-viewed` — newest-first product list (max 20).
- `POST /recently-viewed` `{ product_id }` — record/refresh a view (204).
- `POST /recently-viewed/merge` `{ items: [{ product_id, viewed_at }] }` — merge guest history (max 50), returns the merged list.

## Design decisions
- **Response shape = product list item** (Product + variants/images), identical to `GET /products`, so the frontend renders both the guest and customer carousels with the same `ProductCard`. No custom response DTO.
- **Visibility filtering is delegated** to `ProductService.findActiveByIds(ids)` (active product + active shop). The repository only manages the ordered id list; product hydration + filtering live in one place, shared with the bulk `GET /products?ids=` endpoint. Products deactivated after being viewed simply drop out.
- **UPSERT + prune** in the repository: `upsertView` bumps `viewed_at` (raw `SYSUTCDATETIME()` to stay UTC-consistent — not `@UpdateDateColumn`); `pruneToLimit` trims to the newest 20 per user after each write. Unique/FK races are swallowed (idempotent).

## Dependencies
- `ProductModule` (injects `ProductService`) — never touches the product repository/entity directly.
