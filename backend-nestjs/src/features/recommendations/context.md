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
  weighted category map (PURCHASE×5, ADD_TO_CART×3, ADD_TO_WISHLIST×2, VIEW×1, **SEARCH×1** —
  `getSearchedCategories` matches `metadata.keyword` against active product names → their categories;
  keyword must be ≥3 chars to cut noise), price range, shop weights. A guest with only SEARCH signal
  escapes cold-start.
- **Recency decay:** each per-row interaction signal (`getInteractedProducts`) is multiplied by
  `0.5 ** (ageDays / 30)` (30-day half-life) before folding into the category/shop weights — a recent
  action counts more than an old one. Missing/invalid `created_at` → decay 1 (no decay). *Limitation:*
  `getViewedCategories` / `getSearchedCategories` are aggregate `COUNT`s (no per-row timestamp) → **not
  decayed**, kept count-based.
- **Price band:** the preferred range is the **10–90 percentile** of interacted prices (raw min/max only
  when <4 samples) — one outlier can't widen the band so wide that `+2` is free.
- Candidate score: category fit **scaled by preference strength** `3 × (categoryWeight / maxCategoryWeight)`
  (dominant category → full 3, weaker preferred categories → proportionally less — not the old binary +3) ·
  `+2` price in range · `+1` same shop. Excludes already-purchased and already-interacted — the exclusion
  applies to **both** the scored set and the best-seller top-up (so a just-viewed/carted item never
  re-appears). **Equal scores are broken by best-seller rank** (product outside the pool sorts last) so the
  order is stable, not arbitrary DB order. The best-seller pool is fetched **once** (after the cold-start
  guard) and reused for both the tiebreak and the top-up. Topped up so carousels never blank.
- Reason label = dominant category name. Default deterministic ("Because you like {category}"), null on
  cold-start/fallback. `RecommendationReasonService` optionally AI-phrases it when
  `RECOMMENDATIONS_AI_REASON=true` (reuses AI-chatbox OpenRouter model, in-memory cache per category
  TTL 6h, 4s timeout) — any miss (flag off / no key / error / timeout) falls back to the deterministic
  label, so the `reason: string|null` contract and default latency are unchanged.

## Similar / Frequently-bought-together (co-signals)
- **Co-view** (`getCoViewedIds`): min co-occurrence support (≥2) drops one-off noise, ranked by a
  **popularity-dampened** score `co-count / SQRT(total views of candidate)` so a blockbuster viewed by
  everyone doesn't dominate purely by popularity.
- **Co-purchase** (`getCoPurchasedIds`): min support (≥2), ranked by raw co-occurrence — **deliberately
  NOT dampened** (a popular complement like a case/charger *should* surface; co-purchase is already a
  strong intentful signal). `count/sqrt(pop)` is a cosine-style heuristic, not true lift `P(B|A)/P(B)`.
- Both degrade gracefully: min-support emptying a sparse result just falls through the existing chain
  (co-view→content-similar→best-seller; co-purchase→Similar).
- **Demo data:** the seed carries enough density for both signals to clear min-support (≥2) —
  `user-activity.seed.ts` has co-view reinforcement rows (books/fashion viewed by ≥2 owners) and
  `order.seed.ts` has completed co-purchase orders repeating natural pairs (AirPods↔Sạc, sneaker↔dép,
  iPhone↔Samsung/Sạc, DNT↔Atomic), so "Frequently Bought Together" shows real co-purchase, not fallback.

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
