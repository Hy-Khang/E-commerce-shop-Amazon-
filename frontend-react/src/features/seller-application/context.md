# Seller Application (FE — Module 24)

## Purpose
Customer-facing "Đăng ký bán hàng" onboarding + admin moderation queue.

## Pages
- `SellerApplicationPage` (`/become-seller`, storefront, AuthGuard) — shows the apply form, or the current
  application state: pending / approved (→ "Vào Seller Center") / rejected (+ reason, re-apply form).
- `AdminSellerApplicationListPage` (`/admin/seller-applications`) — queue table + status filter.
- `AdminSellerApplicationDetailPage` (`/admin/seller-applications/:id`) — details + approve / reject (with reason).

## API deps (`seller-application.service.ts`)
`POST /seller-applications`, `GET /seller-applications/me`, admin `GET/:id`, `PATCH :id/approve|reject`.

## State
- Server state only (TanStack Query). `useEnterSellerCenter` refreshes the token pair + profile after
  approval so the new `seller` role/permissions land without a full re-login, then navigates to `/seller`.
- CTA lives in `UserDropdown` (storefront header) — shown only when the user lacks `portal:seller`.
