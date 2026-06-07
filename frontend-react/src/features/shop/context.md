# Shop Feature

## Purpose
Gives each seller a storefront identity (name, logo, description, banner, slug). Products are linked to shops instead of directly to users.

## Pages
- **ShopProfilePage** (`/shops/:slug`) — public shop profile with header (banner, logo, stats) and paginated product listing
- **SellerShopSettingsPage** (`/seller/shop`) — seller creates or updates their shop profile (name, description, logo, banner)

## API Dependencies
- `GET /shops/:slug` — public shop profile with computed stats (product_count, average_rating, total_sales)
- `GET /shops/:slug/products` — paginated product listing for a shop
- `GET /seller/shop` — get current seller's shop
- `POST /seller/shop` — create shop (one per seller)
- `PATCH /seller/shop` — update shop (name, description, logo_url, banner_url; slug is immutable)

## State Decisions
- **Server state via TanStack Query** — shop profile, shop products, seller's own shop
- **No Zustand store** — no cross-feature client state needed
- **Shop data on products** — backend returns `shop: { id, name, slug, logo_url }` nested in product responses; displayed via ShopInfoCard on ProductDetailPage

## Key Components
- **ShopInfoCard** — compact card (logo, name, "Visit Shop" link) used on ProductDetailPage
- **ShopHeader** — full header with banner, logo, stats used on ShopProfilePage
- **ShopSettingsForm** — handles both create (no shop) and update (existing shop) flows
