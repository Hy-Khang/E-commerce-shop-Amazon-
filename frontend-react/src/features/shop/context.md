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

## State Decisions
- **Server state via TanStack Query** — shop profile, shop products, seller's own shop
- **No Zustand store** — no cross-feature client state needed
- **Shop data on products** — backend returns `shop: { id, name, slug, logo_url }` nested in product responses; displayed via ShopInfoCard on ProductDetailPage

## Key Components
- **ShopInfoCard** — compact card (logo, name, "Visit Shop" link) used on ProductDetailPage
- **ShopHeader** — full header with banner, logo, stats used on ShopProfilePage
- **ShopSettingsForm** — handles both create (no shop) and update (existing shop) flows

## Shop Decoration (Module 26)
- **Schema:** `types/decoration.types.ts` — TS types + Zod (`decorationConfigSchema`) + `DECORATION_LIMITS` (keep in sync with the BE DTO) + `parseDecorationConfig` (guard-parse unknown → config | null). Block types: `hero` / `rich_text` / `image` / `product_grid` (extensible).
- **Public renderer:** `components/decoration/ShopDecorationRenderer.tsx` — registry-driven (`BLOCK_RENDERERS`), version-gated, skips unknown blocks, each block wrapped in `BlockErrorBoundary`; applies theme accent via scoped `--shop-accent` CSS var. Blocks in `components/decoration/blocks/` use storefront semantic tokens. `rich_text` renders plain text (`whitespace-pre-line`) — never `dangerouslySetInnerHTML`.
- **Builder:** `pages/SellerShopDecorationPage.tsx` + `components/decoration/builder/*` (BlockListEditor with arrow reorder, BlockEditorPanel dispatcher, per-type editors, ThemeEditor, DecorationPreview reusing the storefront renderer). Portal design language (slate/amber + dark). Seeds editor state from the loaded shop via adjust-state-during-render (no effect).
- **Hooks:** `useProductsByIds` (pinned grid hydration), `useUpdateShopDecoration` (save/reset, invalidates both `['seller','shop']` and `shopKeys.detail(slug)`). `useShop` guard-parses `decoration_config` in its `select`.
- **Additive:** ShopProfilePage renders decoration above, and the "All Products" catalog always below.
