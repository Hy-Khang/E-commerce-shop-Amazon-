# Recommendations Feature (Module 22 — Smart Recommendations)

Personalization layer: capture behavior → build a content-based profile → surface
product suggestions. Guest + customer, on-demand scoring (no Redis).

## Endpoints (all `@Public()`, identity via optional JWT + `x-session-id`)
- `POST /activity` — record one behavioral signal. Best-effort, `204`. Missing
  identity or unknown target id → silent no-op.
- `GET /recommendations?limit=` — "Recommended for You": `{ reason, products[] }`.
- `GET /products/:id/similar?limit=` — content similarity blended with co-view.
- `GET /products/:id/frequently-bought-together?limit=` — co-purchase, falls back to similar.

## Signal capture (hybrid)
- Frontend `POST /activity` for VIEW_PRODUCT / VIEW_CATEGORY / SEARCH / ADD_TO_CART / ADD_TO_WISHLIST.
- PURCHASE server-side: `RecommendationsListener` `@OnEvent('order.created')` resolves each
  `productVariantId → product_id` via `ProductService.findVariantById` and logs a PURCHASE row.
  `order.created` was enriched with `userId` (optional field on `OrderCreatedEvent`).

## Scoring (`recommendations.service.ts`)
- Profile built on-demand from the caller's last-90-day rows (scoped by `user_id` OR `session_id`):
  weighted category map (PURCHASE×5, ADD_TO_CART×3, ADD_TO_WISHLIST×2, VIEW×1), price range, shop weights.
- Candidate score: `+3` preferred category · `+2` price in range · `+1` same shop; excludes
  already-purchased and already-interacted. Ranked, topped up with best-sellers so carousels never blank.
- Reason label = dominant category name ("Because you like {category}"), null on cold-start/fallback.

## Architecture notes
- All QueryBuilder lives in `repositories/user-activity-log.repository.ts` (service scores in memory).
- Cross-table reads (products/orders/order_items/wishlist) use `this.repo.manager` (the
  HomepageRepository `.mgr` pattern) — no other feature's repository/entity is imported.
  `ProductModule` is imported for `ProductService` (variant lookup + card hydration).
- Hydration via `ProductService.findActiveByIdsWithStats` (visibility filter + review stats).
- `user_activity_log.target_id` is deliberately NOT a FK (lenient logging). `user_id` FK is
  `ON DELETE CASCADE` (single cascade path from users → safe).
- Cleanup cron (`recommendations.scheduler.ts`) deletes rows older than 90 days daily at 2 AM.
- Dev DB `synchronize` auto-creates the table; migration `1757000000000-CreateUserActivityLogTable`
  is the prod source of truth (entity registered in `data-source.ts`).
