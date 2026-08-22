# Feature: Coupon

## Purpose
Coupon/discount code system for the e-commerce platform. Customers enter coupon codes at checkout to receive discounts. Admins manage coupons with scope-based targeting (entire order, specific categories, or specific products).

## Pages
- **CheckoutPage** (order feature) — voucher selection grouped by shop (`CheckoutShopGroup` shop rows + a platform-voucher row), opening a scoped `CouponSelectorModal`; mirrors the Cart page
- **AdminCouponListPage** — List all coupons (platform + shop); Owner column + filter. Create/edit (platform coupons only) happen in-page via a `CouponFormModal` popup; a "View usages" row action opens `AdminCouponUsagesDrawer`; deactivate/unlock any.
- **SellerCouponListPage** — List the seller's own shop coupons (amber portal). Create/edit happen in a `CouponFormModal` popup (scope all/products, code auto-prefixed with shop slug); admin-locked coupons open read-only. "View usages" opens `SellerCouponUsagesDrawer`.

## Shared components
- **CouponForm** — reused by admin & seller; props `hideCategoryScope`, `codePrefix`, `productSource` ('admin' | 'seller')
- **CouponFormModal** — `Drawer variant="modal" size="xl"` wrapper around `CouponForm`; owns the RHF instance, hydrates edit via `values` from the fetched detail (spinner while `isLoadingDetail`), and renders a read-only locked notice when `locked`. Create + edit both live on the list pages (no separate routes).
- **AdminCouponUsagesDrawer / SellerCouponUsagesDrawer** — `Drawer` popups listing a coupon's usages (`useAdminCouponUsages` / `useSellerCouponUsages`), opened from the "View usages" row action.
- **MultiItemPicker** — `source` prop switches products between `useAdminProducts` and `useSellerProducts`
- **CouponPicker** — checkout trigger (Shopee-style). Drop-in for `CouponInput` (same `appliedCoupons`/`onApply`/`onRemove`) plus `cartSig`. Shows applied coupons + a button that opens `CouponSelectorModal`.
- **CouponSelectorModal** — voucher picker: manual-entry fallback (`useValidateCoupon`) + platform/per-shop sections of selectable vouchers (`useAvailableCoupons`). Edits a local draft seeded from the applied set; "Apply" commits the diff. ≤1 per group. `CouponOptionRow` renders each voucher with its eligibility/reason. `scope` prop (`'all'` default | `'platform'` | `shopId`) filters which sections/manual codes are shown/allowed — the Cart page opens it scoped per shop or to platform; the draft is still seeded from the full applied set so hidden-group coupons are preserved.
- **VoucherRow** — one voucher slot (platform or a single shop): the applied coupon (Change / remove) or a dashed "select" button. Shared by the Cart page (shop rows + platform row) and the Checkout page (shop groups + platform row) so both read identically.
- **CouponInput** — legacy blind-entry input, kept for back-compat (no longer used by checkout).

## API Dependencies
- `POST /coupons/validate` — Customer validates coupon code, returns discount info + scope + `shop_id`
- `GET /coupons/available` — Customer voucher catalog for the current cart (`useAvailableCoupons`, key `couponKeys.available(cartSig)`) — platform + per-shop groups, each coupon tagged `eligible` + `reason`. Advisory; the preview/checkout decide the real numbers.
- `GET|POST /admin/coupons`, `GET|PATCH|DELETE /admin/coupons/:id`, `GET /admin/coupons/(:id/)usages` — admin (list supports `owner`/`shop_id` filters; platform coupons only for create/edit)
- `GET|POST /seller/coupons`, `GET|PATCH|DELETE /seller/coupons/:id`, `GET /seller/coupons/:id/usages` — seller (shop-scoped, ownership-enforced)

## State Decisions
- **Server state** — TanStack Query for all coupon data (admin CRUD, validation)
- **Form state** — React Hook Form + Zod for coupon creation/editing
- **Applied-voucher selection** — `useAppliedCouponsStore` (Zustand, `stores/applied-coupons.store.ts`): the customer's picked vouchers (`AppliedCouponEntry[]`), shared between the Cart page and Checkout so choices carry over. Client UI state, not server data; ≤1 per group (`apply`), `reconcile` prunes to the current cart, `clear` on order success. Not persisted (reload drops it, matching the old `useState`).

## Cross-Feature Integration
- **Order feature** — CheckoutPage renders shop-grouped voucher rows (`CheckoutShopGroup`) + a platform-voucher row, all opening a scoped `CouponSelectorModal`; the shared store holds the `AppliedCouponEntry[]` and the page sends `coupon_codes[]`. The modal enforces ≤1 platform + ≤1 per shop client-side (grouped by `shop_id`). `appliedCoupons` (page state) is the source of truth for what's applied — availability is only a catalog, so a manually-entered/hidden code stays applied even if it never appears in `GET /coupons/available`. Selected-then-expired vouchers are caught by the existing preview `COUPON_0xx` gating (no extra handling).
- **Order display** — customer OrderDetailPage renders the `applied_coupons[]` breakdown (falls back to `coupon_code`/`discount_amount` for older orders).

## Phase 5 additions (voucher on the Cart page)
- **Shared selection store** — `useAppliedCouponsStore` replaces CheckoutPage's local `useState`; the Cart page (grouped by shop) writes it too, so the selection carries into Checkout and stays editable. Cleared on successful checkout.
- **estimateCouponDiscount** (`utils/coupon.util.ts`) — extracted from CheckoutPage's old local `calculateDiscount`; advisory per-coupon estimate reused by the Cart summary. Exact numbers still come from `POST /orders/preview` / checkout.
- **Scoped modal** — `CouponSelectorModal` gained a `scope` prop so the Cart can open a platform-only or single-shop picker while still committing against the whole applied set.

## Phase 4 additions
- **Selectable voucher picker** — `GET /coupons/available` powers a Shopee-style modal (`CouponSelectorModal`) grouping platform + per-shop vouchers with per-coupon eligibility (`eligible` + `reason`: below_min/no_applicable_items/user_limit). Ineligible rows are greyed with a reason ("Add X more to use"); hidden/expired/exhausted coupons never appear. Manual entry retained as fallback. `cartSig` (same signature as the checkout preview) keys the query so both refetch in lockstep.
- **optionToValidation** (`utils/coupon.util.ts`) — adapts a picked `CouponOption` to the `CouponValidationResult` shape the checkout page consumes; only `code`/`discount_type`/`discount_value`/`max_discount_amount`/`min_order_amount`/`shop_id` are read (the local fallback estimate + group key), so `applicable_*_ids` are `null`.

## Phase 2 additions
- **Multi-coupon checkout** — stack one platform coupon with one coupon per shop; server computes exact per-shop distribution (FE total is an estimate).
- **Admin lock** — AdminCouponListPage shows a "Locked" badge for `admin_disabled` shop coupons and an Unlock action (`useUnlockCoupon` → `PATCH /admin/coupons/:id/unlock`).
- **Seller lock** — SellerCouponListPage shows "Locked by admin" (no deactivate); opening an admin-locked coupon in the `CouponFormModal` renders a read-only locked notice instead of the form.
