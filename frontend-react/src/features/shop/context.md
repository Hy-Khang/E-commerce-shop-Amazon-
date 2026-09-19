# Shop Feature

## Purpose
Gives each seller a storefront identity (name, logo, description, banner, slug). Products are linked to shops instead of directly to users.

## Pages
- **ShopProfilePage** (`/shops/:slug`) — public shop profile: header (banner, logo, stats) → decoration blocks (if any) → the always-present "All Products" paginated listing
- **SellerShopSettingsPage** (`/seller/shop`) — seller creates or updates their shop profile (name, description, logo, banner)
- **SellerShopDecorationPage** (`/seller/shop/decoration`) — block-based storefront builder (Module 26): 2-col layout = builder (block list + theme + per-type editor) + sticky live preview

## API Dependencies
- `GET /shops/:slug` — public shop profile with computed stats (product_count, average_rating, total_sales)
- `GET /shops/:slug/products` — paginated product listing for a shop
- `GET /seller/shop` — get current seller's shop
- `POST /seller/shop` — create shop (one per seller)
- `PATCH /seller/shop` — update shop (name, description, logo_url, banner_url, `decoration_config`; slug is immutable)
- `GET /products?ids=` — hydrate pinned products for a `product_grid` decoration block (via `useProductsByIds`, visibility-filtered, pin order preserved)
- `GET /products?shop_id=&sort=best_selling&order=desc&limit=` — hydrate the auto `best_sellers` decoration block (via `useShopBestSellers`; no new endpoint)

## State Decisions
- **Server state via TanStack Query** — shop profile, shop products, seller's own shop
- **No Zustand store** — no cross-feature client state needed
- **Shop data on products** — backend returns `shop: { id, name, slug, logo_url }` nested in product responses; displayed via ShopInfoCard on ProductDetailPage

## Key Components
- **ShopInfoCard** — compact card (logo, name, "Visit Shop" link) used on ProductDetailPage
- **ShopHeader** — full header with banner, logo, stats used on ShopProfilePage
- **ShopSettingsForm** — handles both create (no shop) and update (existing shop) flows

## Shop Decoration (Module 26)
- **Schema:** `types/decoration.types.ts` — TS types + Zod (`decorationConfigSchema`) + `DECORATION_LIMITS` + `BEST_SELLERS_LIMITS` (keep in sync with the BE DTO) + `parseDecorationConfig` (guard-parse unknown → config | null) + `DecorationRenderContext`. Block types: `hero` / `rich_text` / `image` / `product_grid` / `best_sellers` (extensible).
- **Render context:** `DecorationRenderContext { shopId?; shopSlug?; preview? }` is threaded as the 2nd arg to each registry renderer — `shopId` lets `best_sellers` query the shop's top sellers; `preview` (builder only) switches blocks to sample/placeholder content. The public storefront never sets `preview`, so sample data never leaks to shoppers.
- **Public renderer:** `components/decoration/ShopDecorationRenderer.tsx` — registry-driven (`BLOCK_RENDERERS`), version-gated, skips unknown blocks, each block wrapped in `BlockErrorBoundary`; applies theme accent via scoped `--shop-accent` CSS var. Blocks in `components/decoration/blocks/` use storefront semantic tokens. `rich_text` renders plain text (`whitespace-pre-line`) — never `dangerouslySetInnerHTML`.
- **Auto best-sellers block:** `blocks/BestSellersBlock.tsx` + `hooks/useShopBestSellers.ts` — no product picker; editor (`builder/BestSellersBlockEditor.tsx`) only sets `title` / `limit` (4/8/12) / `columns` (2/3/4). Renders real top sellers on the public page (empty state when the shop has no sales), sample products only under `preview`.
- **Quick-start templates:** `utils/decoration-presets.ts` (`DECORATION_PRESETS`, each `build()` returns a fresh schema-valid config) + `builder/PresetGallery.tsx` (applies a preset; `ConfirmModal` guards the swap when blocks exist). Presets favor `best_sellers` over an empty `product_grid` so every template is savable out of the box.
- **Rich preview:** `builder/DecorationPreview.tsx` renders a mini-storefront (mock header + renderer with `preview: true` + mock "All Products") from `utils/decoration-preview-samples.ts` (`SAMPLE_PRODUCTS` with negative ids, `PLACEHOLDER_HERO_IMAGE`). Hero/Image/ProductGrid/BestSellers show placeholders/sample content only when `preview === true`.
- **Builder:** `pages/SellerShopDecorationPage.tsx` + `components/decoration/builder/*` (PresetGallery, BlockListEditor with arrow reorder, BlockEditorPanel dispatcher, per-type editors, ThemeEditor, DecorationPreview). Portal design language (slate/amber + dark). Seeds editor state from the loaded shop via adjust-state-during-render (no effect).
- **Hooks:** `useProductsByIds` (pinned grid hydration), `useShopBestSellers` (best-sellers hydration), `useUpdateShopDecoration` (save/reset, invalidates both `['seller','shop']` and `shopKeys.detail(slug)`). `useShop` guard-parses `decoration_config` in its `select`.
- **Additive:** ShopProfilePage renders decoration above (with `context={{ shopId, shopSlug }}`), and the "All Products" catalog always below.
