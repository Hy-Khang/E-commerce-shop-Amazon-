# Seller Finance (FE — Module 25)

## Purpose
Seller wallet + payout UI, and admin commission config + withdrawal moderation.

## Pages
- `SellerWalletPage` (`/seller/wallet`, seller portal) — balance card, withdrawal request form,
  wallet ledger (paginated), withdrawal history.
- `AdminCommissionSettingsPage` (`/admin/settings/commission`) — enabled toggle, mode (flat/category),
  platform rate, and (category mode) per-category rate editor (`CommissionCategoryRates`).
- `AdminWithdrawalListPage` (`/admin/withdrawals`) — queue table + approve / reject (refund) with reason.

## API deps (`seller-finance.service.ts`)
`GET /seller/wallet`, `GET /seller/wallet/transactions`, `POST/GET /seller/withdrawals`;
admin `GET /admin/withdrawals`, `PATCH :id/approve|reject`; `GET/PATCH /admin/settings/commission` +
`GET/PUT/DELETE /admin/settings/commission/category-rates`.

## State
- Server state only (TanStack Query); all mutations invalidate `sellerFinanceKeys.all`.
- Dashboard cards (commission / net revenue / commission revenue) come from the dashboard response,
  not this feature.
