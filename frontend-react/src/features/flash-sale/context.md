# Flash Sale Feature (Module 17) — Frontend

## Purpose
Storefront display + admin management of time-limited flash sale campaigns.

## Pages
- `FlashSalePage` (public, `/flash-sale`) — all active campaigns with countdowns + deal grid.
- `AdminFlashSaleListPage` (`/admin/flash-sales`) — campaign CRUD + item management (admin-only).

## Components
- `FlashSaleSection` — homepage carousel strip (self-fetches active deals; renders nothing if none). Exported via barrel for `HomePage`.
- `FlashSaleCard` — one deal (flash price, struck original, "đã bán X%" progress).
- `CountdownTimer` — presentational HH:MM:SS countdown.
- `FlashSaleForm` / `FlashSaleFormModal` — admin campaign create/edit (RHF + Zod).
- `FlashSaleItemsDrawer` — admin add/remove variants on a campaign.

## API deps (services)
- Public: `GET /flash-sales/active`, `GET /flash-sales/:id`.
- Admin: `GET/POST/PATCH/DELETE /admin/flash-sales`, `POST /admin/flash-sales/:id/items`,
  `PATCH|DELETE /admin/flash-sales/items/:itemId`. Guarded by `flash_sales:*` (admin only).

## State
Server state via TanStack Query (`flashSaleKeys`, `adminFlashSaleKeys`). Mutations
invalidate both admin keys and the public active feed. No Zustand — checkout applies
the flash price server-side, so the client never needs to hold flash state.

## Auth / routing
Public route under `MainLayout`. Admin route under `PortalGuard(PERMISSIONS.PORTAL_ADMIN)`;
nav item gated by `PERMISSIONS.FLASH_SALES_READ`.
