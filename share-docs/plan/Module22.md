# Module 22 — Smart Recommendations (Implementation Plan)

## Context

Module 22 (Smart Recommendations / *Gợi ý thông minh*) is the last unbuilt Phase‑6
feature — `PROJECT_STATUS.md` marks it **0%** (no `user_activity_log` table, no scoring
service, no recommendation endpoints). It's the personalization layer: capture user
behavior, build a content‑based profile, and surface product suggestions across the store.

The codebase already contains near‑perfect blueprints, so this is mostly *assembly of
existing patterns*, not new invention:
- **Feature skeleton** → mirror `features/recently-viewed/` (entity + repo UPSERT/prune +
  service + controller + DTOs + module).
- **Aggregation queries** (best‑seller / trending / co‑purchase) → mirror
  `features/homepage/repositories/homepage.repository.ts` (rank‑ids‑then‑hydrate pattern).
- **Card hydration with visibility filter** → reuse `ProductService.findActiveByIds` /
  `findActiveByIdsWithStats` (active product + active shop, returns the `ProductListItem`
  shape every carousel already renders).
- **Guest+customer identity** → `@Public()` route + optional JWT (`JwtAuthGuard` populates
  `req.user` on public routes when a token is present) + `x-session-id` header, exactly like
  Cart / AI‑Chat (`resolveOwner` in `ai-chat.controller.ts` lines 98‑108).
- **Carousels + view‑tracking** → copy `RecentlyViewedCarousel.tsx` scroll shell and the
  `useTrackView` best‑effort pattern.

**Confirmed decisions (from user):**
1. **Hybrid signal capture** — PURCHASE captured server‑side via the existing `order.created`
   event; VIEW/CATEGORY/SEARCH/ADD_TO_CART/ADD_TO_WISHLIST via a public `POST /activity`
   fired from the frontend.
2. **All three surfaces** — *Gợi ý cho bạn* (Home), *Sản phẩm tương tự* (Detail),
   *Mua kèm* (Detail) — **plus all four enhancements**: empty‑state fallbacks, rule‑based
   reason label, cart‑page upsell, and similar‑by‑behavior (co‑view) blend.
3. **Seed demo activity data** — extend the seeder with ~50‑100 `user_activity_log` rows.
4. **No Redis** — repo has none (TECH_DEBT TD‑001); scoring runs **on‑demand** per request
   (matches the doc's "scoring service chạy on‑demand" note). Query cost bounded by small
   candidate sets + indexes.

---

## Plan freshness re‑check (2026‑09‑05, post Module 24+25)

Re‑verified against `develop` after the `feat(seller-finance): Module 24+25` commit. The plan's
architecture is **unaffected** — but three concrete deltas landed and are folded into the sections
below:

1. **UI copy is English, not Vietnamese** (per commit's vi→en switch + memory *UI strings
   English‑only*). There is **no i18next** in the FE — section titles are hardcoded English strings
   (`RecentlyViewedCarousel` renders `"Recently Viewed"`, `RelatedProducts` renders
   `"Related Products"`). The Vietnamese names in this plan (*Gợi ý cho bạn* / *Sản phẩm tương tự* /
   *Mua kèm*) are internal identifiers only — the rendered `<h2>` must be **"Recommended for You" /
   "Similar Products" / "Frequently Bought Together"** (hardcoded, no `t()`; `t()` is toast‑only).
2. **`order_items.category_id` snapshot now exists** (Module 25, [order-item.entity.ts:61](backend-nestjs/src/features/order/entities/order-item.entity.ts#L61)) —
   a checkout‑time category snapshot. Recommendations can read it directly for PURCHASE‑category
   weighting and co‑purchase category context instead of runtime‑joining `products` (survives
   product deletion). It is **nullable** (old rows / deleted category), so always fall back to a
   `products` join when null. Optional optimization, not required.
3. **A spec pins the exact `order.created` payload** —
   [order.service.spec.ts:230](backend-nestjs/src/features/order/tests/order.service.spec.ts#L230)
   asserts `emit('order.created', { orderId, items:[{ productVariantId, quantity }] })` with
   `toHaveBeenCalledWith` (exact match). Adding `userId` to the emit **will break this test** — the
   assertion must be updated in the same change (see PURCHASE listener section).

Everything else verified current: `order.created` still emits `{ orderId, items:[{ productVariantId,
quantity }] }` with no `userId` ([order.service.ts:381](backend-nestjs/src/features/order/order.service.ts#L381));
`ProductService.findVariantById` / `findActiveByIds` / `findActiveByIdsWithStats` all still present;
`RelatedProducts` is still naive category‑only (grid) and remains the component the new
`SimilarProductsCarousel` supersedes.

---

## Backend — `backend-nestjs/src/features/recommendations/`

New self‑contained feature module, registered in `src/app.module.ts` imports (like
`RecentlyViewedModule`). Imports `ProductModule` (inject `ProductService`) and
`TypeOrmModule.forFeature([UserActivityLog])`.

```
features/recommendations/
├── recommendations.module.ts
├── recommendations.controller.ts        — 4 routes (all @Public, optional JWT + x-session-id)
├── recommendations.service.ts           — scoring + orchestration
├── activity.service.ts                  — write path (record activity, idempotent-ish, lenient)
├── recommendations.listener.ts          — @OnEvent('order.created') → log PURCHASE
├── recommendations.scheduler.ts         — @Cron daily cleanup (>90 days)
├── entities/user-activity-log.entity.ts
├── repositories/user-activity-log.repository.ts   — writes + profile/co-view/co-purchase queries
├── dto/record-activity.dto.ts
├── dto/recommendation-response.dto.ts
├── types/recommendations.types.ts
└── context.md
```

### Entity — `user_activity_log`

Columns (snake_case, TypeORM decorators per `recently-viewed.entity.ts` conventions):
- `id` INT PK
- `user_id` INT NULL, FK → `users.id` **ON DELETE CASCADE** (single cascade path from users → safe)
- `session_id` NVARCHAR(100) NULL — guest identity (mirrors `carts.session_id`)
- `action` NVARCHAR(30) NOT NULL — `VIEW_PRODUCT` / `VIEW_CATEGORY` / `SEARCH` / `ADD_TO_CART` / `ADD_TO_WISHLIST` / `PURCHASE`
- `target_type` NVARCHAR(20) NOT NULL — `product` / `category` / `search`
- `target_id` INT NULL — product/category id (NULL for `SEARCH`). **Deliberately NOT a FK** —
  logging stays lenient (a later product/category delete must not cascade‑wipe history or
  break a write); scoring joins to `products`/`categories` best‑effort and drops misses.
- `metadata` NVARCHAR(MAX) NULL — JSON (e.g. `{ keyword }` for SEARCH; price/shop hints)
- `created_at` DATETIME2 DEFAULT `SYSUTCDATETIME()`

Indexes: `idx_user_activity_log_user (user_id, created_at)`,
`idx_user_activity_log_session (session_id, created_at)`,
`idx_user_activity_log_target (target_type, target_id, action)` (co‑view / co‑purchase joins),
`idx_user_activity_log_created (created_at)` (cleanup cron).

**Schema apply:** dev DB is `DB_SYNCHRONIZE=true` → table + declared indexes auto‑create on
app boot (autoLoadEntities). Also add a parallel hand‑written migration
`src/core/database/migrations/<ts>-CreateUserActivityLogTable.ts` (template:
`1756500000000-CreateRecentlyViewedTable.ts`) and register the entity in
`src/core/database/data-source.ts` (prod source of truth). No filtered indexes here, so no
manual‑SQL gotcha.

### Endpoints (all `@Public()`, resolve `{ userId | sessionId }` like AI‑chat/cart)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/activity` | Record one activity (`{ action, target_type, target_id?, metadata? }`). Best‑effort, returns **204**. Unknown/inactive product id is **swallowed** (fire‑and‑forget), not an error. Missing identity (no JWT, no `x-session-id`) → also a silent 204 no‑op. |
| GET | `/api/v1/recommendations` | *Gợi ý cho bạn* — personalized set. Returns `{ reason: string\|null, products: ProductListItem[] }`. Optional `?limit=` (default 12). |
| GET | `/api/v1/products/:id/similar` | *Sản phẩm tương tự* — content similarity **blended with co‑view**. Returns `{ products: ProductListItem[] }`. |
| GET | `/api/v1/products/:id/frequently-bought-together` | *Mua kèm* — co‑purchase, **fallback to similar** when sparse. Returns `{ products: ProductListItem[] }`. |

> **Route safety:** the two `/products/:id/...` routes are declared by the recommendations
> controller. This cross‑controller pattern is already proven — the review controller registers
> `GET /products/:productId/reviews` — and neither shadows `GET /products/:slug` (single‑segment
> `:slug` param can't match a two‑segment `/products/:id/similar`). Path kept per the doc.
> **Card hydration:** prefer `findActiveByIdsWithStats` (adds `avgRating`/`reviewCount` so cards
> show stars) via the same `?ids=` service path Compare/Recently‑Viewed use; plain
> `findActiveByIds` is an acceptable fallback (rating simply hidden). Return the hydrated
> products **raw** (like the `?ids=` branch) so `variants`/`category` serialize for `ProductCard`.

> `POST /activity` is deliberately lenient (analytics signal, never blocks UX). Validate the
> DTO enums; tolerate stale/unknown target ids. Guard against log spam later via throttler if
> needed (out of scope now).

### Scoring — content‑based (`recommendations.service.ts` + repo)

**Profile vector** (built on‑demand from the caller's `user_activity_log` rows, last 90 days,
scoped by `user_id` OR `session_id`):
- **Preferred categories** — frequency map weighted by action (`PURCHASE`×5, `ADD_TO_CART`×3,
  `ADD_TO_WISHLIST`×2, `VIEW_PRODUCT`×1, `VIEW_CATEGORY`×1). Resolve product→category by
  joining `products` (for PURCHASE rows the checkout‑time `order_items.category_id` snapshot is
  available as a join‑free shortcut — nullable, so fall back to the `products` join when null).
- **Price range** — min/max (or 10th–90th pct) of prices of products interacted with.
- **Preferred shops** — shop frequency from interacted products.

**Candidate scoring** (per the doc's formula):
- `+3` product in a preferred category · `+2` price within preferred range · `+1` same
  preferred shop · **exclude already‑purchased** (`PURCHASE` rows) · exclude
  recently‑interacted duplicates. Rank → take top N ids → hydrate with
  `ProductService.findActiveByIds` (visibility filter) → map to `ProductListItem`.
- The repo owns all QueryBuilder (per BE rules); service orchestrates + scores in memory.

**Reason label (enhancement):** derive the single dominant profile signal (top‑weighted
category name) → `reason = "Vì bạn quan tâm {categoryName}"`. `null` when cold‑start/fallback.

**Empty‑state fallback (enhancement):** no activity / too few candidates → fall back to a
best‑seller ranking (`SUM(oi.quantity)` over `orders.status IN ('delivered','completed')`,
same query shape as `HomepageRepository.getBestSellers`) then trending, hydrated identically.
The recommendations repo runs its **own** ranking query via `this.repo.manager.createQueryBuilder()`
(the `HomepageRepository` `.mgr` pattern — cross‑table access without importing another feature's
repository/entity, honoring the feature‑boundary rule) and hydrates via `ProductService`. This is
an intentional, small query duplication (the boundary rule forbids importing `HomepageRepository`).
Carousels are therefore never blank.

### Similar products (content + co‑view blend, enhancement)

1. **Content‑similar** ids: same `category_id` (fallback to same parent category), price within
   ±40% of the product's min price, exclude self, active product + active shop.
2. **Co‑view** ids: other products with `VIEW_PRODUCT` rows by sessions/users who also have a
   `VIEW_PRODUCT` of `:id` (self‑join `user_activity_log`), ranked by co‑occurrence.
3. **Blend**: interleave co‑view first, fill with content‑similar; dedup, drop self/purchased,
   cap N; hydrate via `ProductService.findActiveByIds`. Falls back to pure content‑similar when
   co‑view is empty.

### Frequently bought together (co‑purchase, enhancement fallback)

Co‑purchase via `order_items` self‑join within the same `orders.order_group_id` (products
bought in the same checkout), restricted to `orders.status IN ('delivered','completed')`,
ranked by co‑occurrence count, excluding `:id` itself. Sparse result → **fallback to Similar**.
Hydrate via `ProductService.findActiveByIds`.

### PURCHASE signal — event listener (hybrid)

`RecommendationsListener` `@OnEvent('order.created')` → writes one `PURCHASE` activity row per
purchased product for the buyer. Verified specifics:
- `order.created` is emitted **per sub‑order** (loop at `order.service.ts:374`), current payload
  `{ orderId, items: [{ productVariantId, quantity }] }` — **no `userId`, no `productId`** (order_items
  carry `product_variant_id`, not `product_id`).
- **Single‑field, backward‑compatible enrichment:** add `userId` to that emitted object
  (`order.service.ts` has `userId` in scope) and add optional `userId?: number` to the
  `OrderCreatedEvent` type at **`product/types/product.types.ts:6`** (the type lives in the
  product feature). `ProductService.handleOrderCreated` (`product.service.ts:808`) ignores it —
  inert. No `productId` added to the payload.
- The listener resolves each `productVariantId` → `product_id` via the **existing**
  `ProductService.findVariantById` (`product.service.ts:792`, returns a `ProductVariant` with
  `product_id`); recommendations already imports `ProductModule`. (Optionally add a batch
  `findVariantsByIds` to avoid the small N+1 — nice‑to‑have, not required for the few items/order.)
- Multiple `order.created` events per checkout (one per shop) carry disjoint products, so no
  duplicate PURCHASE rows across events. Listener is best‑effort (log + swallow), consistent with
  `NotificationListener`.
- ⚠️ **Update the existing emit spec** in the same change:
  [order.service.spec.ts:230](backend-nestjs/src/features/order/tests/order.service.spec.ts#L230)
  asserts the exact payload via `toHaveBeenCalledWith` — add `userId` to that expected object so the
  enriched emit still passes. (This is the only order‑feature test that touches the payload shape.)

### Cleanup cron

`RecommendationsScheduler` `@Cron(EVERY_DAY_AT_2AM)` → delete `user_activity_log` rows older
than 90 days (model on the coin expiry cron). Registered via `ScheduleModule` (already imported
app‑wide).

### Seed data

Extend `src/core/database/seeds/` to insert ~50‑100 `user_activity_log` rows across 3‑5 demo
users (mix of VIEW/SEARCH/CART/WISHLIST + a couple PURCHASE) so *Gợi ý cho bạn* and co‑view are
non‑empty in a demo. Rows must use **valid seeded `user_id`s** and **recent `created_at`** (within
the 90‑day window) or scoring/cleanup will ignore them. **Seeding is destructive (`npm run seed`
DELETEs all tables) — run only on explicit user approval.**

---

## Frontend — `frontend-react/src/features/recommendations/`

New feature (barrel `index.ts`, per FE rules). Activity tracking folded in as a hook.

```
features/recommendations/
├── services/recommendations.service.ts   — typed api calls (getRecommendations, getSimilar,
│                                            getBoughtTogether, trackActivity)
├── hooks/useRecommendedForYou.ts          — useQuery, returns { products, reason }
├── hooks/useSimilarProducts.ts            — useQuery(productId)
├── hooks/useFrequentlyBoughtTogether.ts   — useQuery(productId)
├── hooks/useTrackActivity.ts              — best-effort POST /activity (modeled on useTrackView)
├── components/RecommendedForYouCarousel.tsx   — reason header + reuse ProductCard
├── components/SimilarProductsCarousel.tsx
├── components/FrequentlyBoughtTogetherCarousel.tsx
├── types/recommendations.types.ts
└── index.ts
```

- **Carousels** copy the `RecentlyViewedCarousel.tsx` scroll shell (`overflow-x-auto`,
  scroll‑snap, hover chevrons, skeletons, `return null` when empty) and reuse
  `ProductCard` / `ProductCardSkeleton` from `@/features/product`. Responses already return the
  `ProductListItem` shape, so no card changes needed. `RecommendedForYouCarousel` renders the
  `reason` string as a subtitle under the section title when present.
- **All calls go through `@/core/api/axios-instance`** — JWT `Authorization` or guest
  `x-session-id` header is auto‑attached, so guest + customer both work with zero extra wiring.

### Mount points (drop components into existing pages — no route changes)

- `features/product/pages/HomePage.tsx` (~line 217, next to `<RecentlyViewedCarousel />`) →
  `<RecommendedForYouCarousel />`.
- `features/product/pages/ProductDetailPage.tsx`:
  - `<FrequentlyBoughtTogetherCarousel productId={product.id} />` near the buy‑box / after
    `<ShopInfoCard>` (drives add‑to‑cart intent).
  - `<SimilarProductsCarousel productId={product.id} />` after Reviews — **replaces the naive
    category‑only `RelatedProducts.tsx`** (delete that component or leave unused; the new
    endpoint supersedes it).
  - Add `useTrackActivity({ action: 'VIEW_PRODUCT', target_type: 'product', target_id })` next
    to the existing `useTrackView(product?.id)` (line 36).
- `features/cart/pages/CartPage.tsx` → `<RecommendedForYouCarousel />` (cart‑page upsell,
  enhancement) next to the existing Recently‑Viewed mounts.

### Activity tracking wiring

`useTrackActivity` (best‑effort `.catch(() => {})`, `useRef` fire‑once guard like `useTrackView`):
- `VIEW_PRODUCT` — ProductDetailPage mount.
- `VIEW_CATEGORY` — category listing page mount.
- `SEARCH` — search results flow (fire on query submit; `metadata: { keyword }`).
- `ADD_TO_CART` / `ADD_TO_WISHLIST` — fired where the **product id is known** (product‑detail
  add‑to‑cart button, wishlist button — both have product context). Log `target_type: 'product'`,
  `target_id: productId` (not the variant id, since the profile scores at product level). Cart‑page
  quantity tweaks that lack product context are skipped — acceptable signal loss.

> **Scoring inputs:** `VIEW_PRODUCT`/`ADD_TO_CART`/`ADD_TO_WISHLIST`/`PURCHASE` join `products`
> (target_id → category/shop/price). `VIEW_CATEGORY` uses `target_id` as the category directly.
> `SEARCH` (keyword only, no target_id) is stored for completeness but is a weak/optional signal in
> v1 scoring — used at most to bias keyword→category, not required.

---

## Docs to update (during implementation)

- `share-docs/DATABASE.md` — add §2.x `user_activity_log` entity + indexes; ERD line
  `users ||--o{ user_activity_log`.
- `share-docs/API_SPEC.md` — add the 4 endpoints under a new *Recommendations* section; note
  the `order.created` payload enrichment.
- `share-docs/PROJECT_STATUS.md` — flip Module 22 from 0% → done; update the stats table.
- Feature `context.md` files (BE + FE).

---

## Verification (end‑to‑end)

1. **Boot BE** (`npm run start:dev`) → confirm `user_activity_log` table + indexes created
   (synchronize). Swagger at `/api/v1/docs` shows the 4 new routes.
2. **Signal capture** — as guest (no token, `x-session-id` present) hit product/category/search;
   confirm rows land in `user_activity_log`. Log in and place an order → confirm a `PURCHASE`
   row appears via the `order.created` listener (verify enriched payload).
3. **Recommendations** — after seeding demo activity, `GET /recommendations` returns scored
   products + a `reason`; a brand‑new session falls back to best‑sellers (non‑empty).
   `GET /products/:id/similar` and `/frequently-bought-together` return sensible sets and fall
   back correctly when data is sparse.
4. **Frontend** — Home shows *Gợi ý cho bạn* (with reason subtitle); Product Detail shows
   *Mua kèm* + *Sản phẩm tương tự*; Cart shows the upsell carousel. All reuse `ProductCard`,
   scroll/skeleton behave like Recently Viewed, and none render blank (fallbacks).
5. **Tests** (mirror existing `tests/` layout) — BE: scoring/service unit + controller
   identity/lenient‑POST specs + listener idempotency; FE: a carousel component test +
   `useTrackActivity` fire‑once test. Run `npm test` both sides + `tsc -b` (frontend) clean.
6. **Cron** — cleanup deletes >90‑day rows (can validate by inserting a backdated row and
   invoking the handler).

---

## Out of scope (note as future)

- Redis caching of scoring results (TD‑001 — no Redis in repo).
- Admin surface for browsing recommendation activity / analytics.
- LLM‑generated recommendation copy (Module 21 integration) — we ship the **rule‑based** reason
  label instead.
- Throttling `POST /activity` (add `@nestjs/throttler` later if log spam appears).
