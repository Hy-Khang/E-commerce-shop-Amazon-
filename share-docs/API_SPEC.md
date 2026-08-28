# API_SPEC.md — Backend (NestJS)

## 1. Overview

- **Base URL:** `/api/v1`
- **Versioning:** URL path prefix (`/api/v1`, `/api/v2`)
- **Content-Type:** `application/json`
- **Encoding:** UTF-8
- **Style:** RESTful, resource-based naming
- **Docs:** Swagger UI at `/api/v1/docs` (development only)

---

## 2. Authentication

- **Method:** JWT Bearer Token (access + refresh)
- **Header:** `Authorization: Bearer <access_token>`

**Token flow:** Login → `{ accessToken (15min), refreshToken (7d) }`. Every request: `Authorization: Bearer <accessToken>`. Expired → `POST /auth/refresh` → new pair. Logout → revoke refresh token (`is_revoked = true`). Logout all → revoke all tokens for user.

**Auth levels:**

| Level | Description |
|-------|-------------|
| Public | No token needed — `@Public()` decorator |
| Customer | Valid access token with role = `customer` |
| Admin | Valid access token with role = `admin` + required permissions |
| Seller | Valid access token with role = `seller` + required permissions |
| Shipper | Valid access token with role = `shipper` + required permissions |
| Customer or Guest | Token or `session_id` header for guest cart |

**Authorization model:**

Admin endpoints use **permission-based access control** via `@Permissions()` decorator (not `@Roles()`). Each role has a set of permissions assigned via the `role_permissions` junction table. Permissions follow the `resource:action` format (e.g. `products:create`, `orders:read`, `dashboard:read`).

- **Admin** — all permissions
- **Seller** — `products:*`, `categories:read`, `orders:read`, `orders:update`, `uploads:create`, `dashboard:read`, `shops:create`, `shops:read`, `shops:update`
- **Shipper** — `orders:read`, `orders:update`, `dashboard:read`
- **Customer** — no admin permissions (customer actions use JWT auth only)

The `PermissionsGuard` resolves the user's role → looks up permissions via `role_permissions` → caches per role ID → checks against required permissions.

---

## 3. Request Conventions

**Pagination:** `?page=1&limit=20` (defaults: `page=1`, `limit=20`, max `limit=100`). **Sorting:** `?sort=created_at&order=desc`.

**Filtering by feature:**

| Feature | Params |
|---------|--------|
| Products | `?category_id=5&min_price=100&max_price=500&search=keyword&is_active=true` |
| Orders (admin) | `?status=pending&payment_status=unpaid&user_id=123` |
| Orders (customer) | Filtered by JWT `user_id` automatically |
| Reviews | `?product_id=10&rating=5` |
| Coupons (admin) | `?search=keyword&scope=categories&discount_type=percentage&is_active=true` |

---

## 4. Response Format

**Success:** `{ "success": true, "data": { ... } }` — lists add `"meta": { "page", "limit", "total", "totalPages" }`. Delete returns `HTTP 204`, no body.

**Error:** `{ "success": false, "error": { "code": "PRODUCT_001", "message": "..." } }` — validation errors add `"details": [{ "field", "message" }]`.

---

## 5. Error Codes

**Format:** `[FEATURE]_[3-digit number]`

### Common

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_001 | 422 | Validation failed |
| COMMON_001 | 404 | Resource not found |
| COMMON_002 | 500 | Internal server error |

### Feature-Specific

| Code | Status | Description |
|------|--------|-------------|
| USER_001 | 409 | Email already exists |
| USER_002 | 404 | User not found |
| PRODUCT_001 | 404 | Product not found or inactive |
| PRODUCT_002 | 404 | Variant not found |
| PRODUCT_003 | 409 | Duplicate SKU |
| PRODUCT_004 | 404 | Category not found |
| PRODUCT_005 | 409 | Duplicate slug |
| CART_001 | 404 | Cart not found |
| CART_002 | 400 | Cart is empty |
| CART_003 | 400 | Variant out of stock |
| CART_004 | 400 | Requested quantity exceeds stock |
| ORDER_001 | 404 | Order not found |
| ORDER_002 | 400 | Insufficient stock for checkout |
| ORDER_003 | 400 | Invalid status transition (e.g. delivered → pending) |
| ORDER_004 | 403 | Order does not belong to user |
| ORDER_005 | 400 | Order has already been completed or is not in delivered status |
| REVIEW_001 | 403 | Product not purchased — `order_id` verification failed |
| REVIEW_002 | 409 | Review already exists for this order + product |
| CATEGORY_001 | 400 | Cannot delete category with existing products or children |
| VARIANT_001 | 400 | Cannot delete variant referenced by active cart items |
| WISHLIST_001 | 409 | Product already in wishlist |
| WISHLIST_002 | 404 | Product not in wishlist (on remove) |
| WISHLIST_003 | 404 | Product not found or inactive (on add) |
| COUPON_001 | 404 | Coupon not found |
| COUPON_002 | 400 | Coupon expired or not yet active |
| COUPON_003 | 400 | Coupon usage limit exceeded |
| COUPON_004 | 400 | User has used this coupon the maximum number of times |
| COUPON_005 | 400 | Applicable items total below minimum order amount |
| COUPON_006 | 400 | Coupon is not currently active |
| COUPON_007 | 409 | Coupon code already exists (create duplicate) |
| COUPON_008 | 400 | No items in cart are applicable for this coupon |
| COUPON_009 | 400 | One or more products do not belong to the seller's shop |
| COUPON_010 | 403 | Coupon is not owned by the seller's shop (ownership boundary) |
| COUPON_011 | 400 | Invalid coupon combination (more than one platform coupon, or more than one coupon for the same shop) |
| COUPON_012 | 400 | Generated shop coupon code exceeds 50 characters |
| COUPON_013 | 403 | Coupon locked by admin (seller cannot edit or re-enable) |
| ROLE_001 | 409 | Role name already exists |
| ROLE_002 | 400 | Cannot delete system role or role with assigned users |
| PERMISSION_001 | 409 | Permission `resource:action` already exists |
| PERMISSION_002 | 400 | Cannot delete permission assigned to roles |
| PERMISSION_003 | 404 | Permission not found |
| PERMISSION_004 | 403 | Cannot assign permissions you don't have (escalation prevention) |
| PERMISSION_005 | 403 | Cannot modify your own role's permissions |
| PERMISSION_006 | 400 | Cannot delete system role |
| SHOP_001 | 404 | Shop not found |
| SHOP_002 | 409 | Shop already exists for this user (1:1 violation) |
| SHOP_003 | 409 | Duplicate shop slug |
| SHOP_004 | 400 | Shop not set up (seller tries product CRUD without a shop) |
| SHOP_005 | 403 | Shop is not active (status != 'active') |
| NOTIFICATION_001 | 404 | Notification not found |
| PAYMENT_001 | 400 | Order not eligible for payment (COD, cancelled, already paid) |
| PAYMENT_002 | 400 | Active payment already pending for this order |
| PAYMENT_003 | 404 | Payment transaction not found |
| PAYMENT_004 | 400 | Invalid gateway signature |
| PAYMENT_005 | 400 | Amount mismatch |
| PAYMENT_006 | 502 | Gateway API error |

---

## 6. Customer & Public Endpoints

### Auth — `/api/v1/auth`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register new customer account (sends OTP email, no auto-login) | Public |
| POST | `/auth/verify-email` | Verify email with 6-digit OTP → returns token pair | Public |
| POST | `/auth/resend-verification` | Resend verification OTP (60s cooldown, max 5/hour) | Public |
| POST | `/auth/login` | Login, returns token pair (requires `email_verified`) | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/forgot-password` | Request password reset email (silent on unknown email) | Public |
| POST | `/auth/reset-password` | Reset password with token from email | Public |
| POST | `/auth/change-password` | Change password (local users with existing password) | Customer |
| POST | `/auth/set-password` | Set password (OAuth users without password) | Customer |
| POST | `/auth/logout` | Revoke current refresh token | Customer |
| POST | `/auth/logout-all` | Revoke all refresh tokens | Customer |
| GET | `/auth/google` | Initiate Google OAuth redirect | Public |
| GET | `/auth/google/callback` | Google OAuth callback → redirect to frontend with code | Public |
| GET | `/auth/facebook` | Initiate Facebook OAuth redirect | Public |
| GET | `/auth/facebook/callback` | Facebook OAuth callback → redirect to frontend with code | Public |
| POST | `/auth/oauth/exchange` | Exchange one-time OAuth code for token pair | Public |

### User Profile — `/api/v1/users`, `/api/v1/addresses`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/users/me` | Get current user profile | Customer |
| PATCH | `/users/me` | Update profile (full_name, phone) | Customer |
| GET | `/addresses` | List my addresses | Customer |
| POST | `/addresses` | Create new address | Customer |
| PATCH | `/addresses/:id` | Update address | Customer |
| DELETE | `/addresses/:id` | Delete address | Customer |
| PATCH | `/addresses/:id/default` | Set as default address | Customer |

### Product Catalog — `/api/v1/products`, `/api/v1/categories`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/categories` | List category tree | Public |
| GET | `/categories/:slug` | Get category with products (paginated) | Public |
| GET | `/products` | List active products (paginated, filtered, sorted) | Public |
| GET | `/products/:slug` | Get product detail (variants + images + shop info) | Public |

### Shop — `/api/v1/shops`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/shops` | List active shops (paginated, searchable) | Public |
| GET | `/shops/:slug` | Get shop profile with stats (product_count, average_rating, total_sales) | Public |
| GET | `/shops/:slug/products` | List shop's products (paginated, filtered) | Public |

### Seller Shop — `/api/v1/seller/shop`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/seller/shop` | Get current seller's shop | `shops:read` |
| POST | `/seller/shop` | Create shop (one per seller; slug auto-generated, immutable) | `shops:create` |
| PATCH | `/seller/shop` | Update shop (name, description, logo_url, banner_url; slug immutable) | `shops:update` |

### Cart — `/api/v1/cart`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/cart` | Get current cart with items + variant details | Customer or Guest |
| POST | `/cart/items` | Add item (product_variant_id + quantity) | Customer or Guest |
| PATCH | `/cart/items/:id` | Update item quantity | Customer or Guest |
| DELETE | `/cart/items/:id` | Remove item from cart | Customer or Guest |
| POST | `/cart/merge` | Merge guest cart into user cart on login | Customer |

### Order — `/api/v1/orders`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/orders` | Checkout — create orders from cart (1 per shop, linked by `order_group_id`) | Customer |
| POST | `/orders/preview` | Preview checkout totals + per-shop coupon breakdown (advisory, no writes) | Customer |
| GET | `/orders` | List my orders (paginated) | Customer |
| GET | `/orders/group/:groupId` | Get all orders in a group (own only) | Customer |
| GET | `/orders/:id` | Get order detail + order_items + `applied_coupons[]` (own only) | Customer |
| PATCH | `/orders/:id/cancel` | Cancel order (if status = pending) | Customer |
| PATCH | `/orders/:id/confirm-receipt` | Confirm receipt — delivered → completed | Customer |
| PATCH | `/orders/:id/return-request` | Request return/refund — delivered → return_requested | Customer |

> **Multi-shop checkout:** `POST /orders` splits the cart into N orders (1 per shop), all sharing the same `order_group_id` (UUID v4). Returns `CheckoutResponseDto { order_group_id, orders[], total_amount }`. Coupon discount is distributed across sub-orders (see below). Each order has its own `shop_id`, `shop_name` (snapshot), `shipping_fee`, and `total_amount`.
>
> **Multi-coupon (Phase 2):** `POST /orders` accepts `coupon_codes?: string[]` — at most **one platform coupon** plus **one coupon per shop** (violations → `COUPON_011 (400)`). The legacy single `coupon_code?: string` is still accepted and mapped into the array. Each coupon is validated and calculated independently on the original subtotal. Per sub-order the discount is `shopCouponDiscount + platformShareAdj`, where the shop coupon lands first and the platform coupon's share (split across shops by applicable subtotal, largest-remainder rounding) fills the remaining headroom (`platformShareAdj = min(platformShare, shopItemsTotal − shopCouponDiscount)`). `orders.coupon_code` snapshots a single code (shop coupon preferred, else platform); the full breakdown is returned on order detail as `applied_coupons: [{ code, discount_amount }]` and sourced from `coupon_usages`.
>
> **Coupon reversal:** A **shop coupon** is reversed as soon as its own sub-order is cancelled. A **platform coupon** is reversed only when ALL orders in the group are cancelled; `current_uses` is decremented once per coupon. Both are idempotent.
>
> **Platform-discount waterfall:** When a shop coupon consumes most of a shop's headroom, that shop's platform share is capped at `min(applicable, headroom)` and the **leftover is redistributed** to shops that still have room (largest-remainder rounding). The platform discount is never silently lost — the total given equals `min(nominal, Σ per-shop caps)`. `checkout` and `POST /orders/preview` share the same pure distributor, so the preview always matches what checkout charges.
>
> **`POST /orders/preview`** returns `CheckoutPreviewResponseDto { subtotal, discount_total, shipping_total, grand_total, shops[], applied_coupons[] }`. Body is `{ coupon_code?, coupon_codes? }` (same coupon fields as checkout). It is **advisory, exact-at-the-time — NOT a reservation**: it writes nothing (no `coupon_usages`, no stock/usage hold), and `POST /orders` re-validates and remains the sole source of truth (a coupon may run out or expire in between). Invalid coupons return the same `COUPON_0xx` errors as checkout.

### Review — `/api/v1/reviews`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/reviews` | Create review (purchase-verified) | Customer |
| GET | `/products/:productId/reviews` | List reviews for a product (paginated) | Public |
| GET | `/reviews/me` | List my reviews (paginated) | Customer |
| DELETE | `/reviews/:id` | Delete own review | Customer |

### Wishlist — `/api/v1/wishlist`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/wishlist` | Add product to wishlist | Customer |
| DELETE | `/wishlist/:productId` | Remove product from wishlist | Customer |
| GET | `/wishlist` | List my wishlist (paginated) | Customer |
| GET | `/wishlist/check/:productId` | Check if single product is in wishlist | Customer |
| POST | `/wishlist/check` | Bulk check multiple products (body: `product_ids[]`, max 50) | Customer |

### Coupon — `/api/v1/coupons`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/coupons/validate` | Validate coupon code, returns discount info + applicable scope | Customer |
| GET | `/coupons/available` | Selectable-voucher catalog for the current cart (platform + per-shop groups, per-coupon eligibility) | Customer |

> **`GET /coupons/available`** powers the Shopee-style voucher picker. It reads the caller's cart server-side and returns `CouponAvailabilityResponseDto { platform: CouponOptionDto[], shops: [{ shop_id, shop_name, coupons: CouponOptionDto[] }] }`. Each `CouponOptionDto` carries `{ code, description, discount_type, discount_value, scope, shop_id, min_order_amount, max_discount_amount, applicable_total, discount_preview, eligible, reason?, short_of_min?, starts_at, expires_at }`.
>
> **Advisory catalog, not a reservation** (same contract as `POST /orders/preview`): eligibility is computed **per-coupon on the original cart subtotal**, independent of other selections; the real per-shop allocation is still decided by `POST /orders/preview` / checkout, which re-validate and remain the source of truth. Empty cart → `{ platform: [], shops: [] }` (never 400).
>
> **Hidden vs greyed:** Coupons that would fail checkout for an *invisible* reason are omitted entirely — expired / not-yet-started, inactive, `admin_disabled`, globally exhausted (`current_uses >= max_uses`), or belonging to a non-active shop. Cart-dependent failures surface as `eligible: false` with `reason ∈ { below_min, no_applicable_items, user_limit }` (`below_min` adds `short_of_min`). Only shops that have ≥1 available coupon appear in `shops[]`. Any coupon marked `eligible` is guaranteed to pass checkout re-validation at that instant (barring a race).

### Notification — `/api/v1/notifications`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/notifications` | List my notifications (paginated, `?is_read` filter) | Customer |
| GET | `/notifications/unread-count` | Get unread notification count (lightweight, for badge polling) | Customer |
| PATCH | `/notifications/:id/read` | Mark single notification as read (ownership enforced) | Customer |
| PATCH | `/notifications/read-all` | Mark all notifications as read (HTTP 204) | Customer |

> **Polling-based delivery:** Frontend polls `GET /notifications/unread-count` every 30s. No WebSocket infrastructure. Notifications are created automatically via `order.status_updated` event. Admin/seller status changes notify the customer. Customer-initiated confirm receipt and return requests notify the seller(s). Customer-initiated order placement and cancellation do **not** create notifications.

### Payment Gateway — `/api/v1/payments`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/payments/create` | Create payment URL for an order or order group (VNPay/MoMo) | Customer |
| GET | `/payments/vnpay/ipn` | VNPay IPN callback (verify HMAC-SHA512 + update) | Public |
| GET | `/payments/vnpay/return` | VNPay return → redirect to FE result page | Public |
| POST | `/payments/momo/ipn` | MoMo IPN callback (verify HMAC-SHA256 + update) | Public |
| GET | `/payments/momo/return` | MoMo return → redirect to FE result page | Public |
| GET | `/payments/order/:orderId` | Get payment transactions for an order (includes group transactions) | Customer |
| GET | `/payments/admin/order/:orderId` | Get payment transactions for **any** order (admin-only, no owner scope) | `payments:read` |

> **Payment flow:** Customer selects VNPay/MoMo at checkout → `POST /orders` creates N orders (1 per shop, all `payment_status=unpaid`, linked by `order_group_id`) → `POST /payments/create` with `{ order_group_id }` sums all non-cancelled orders' `total_amount` into one gateway transaction → returns `{ payment_url }` → frontend redirects to gateway → user pays → gateway calls IPN endpoint → backend verifies signature + updates `payment_transactions.status` + emits `payment.completed` event with `orderGroupId` → `OrderPaymentListener` sets ALL orders in the group to `payment_status = paid` (single DB transaction) → gateway redirects user to return URL → backend redirects to frontend `/checkout/payment-result?orderGroupId=xxx&status=success`.
>
> **`POST /payments/create` accepts:** `{ order_id?: number, order_group_id?: string }` — at least one required. `order_group_id` creates a single payment covering all active orders in the group. `order_id` pays for a single order (legacy/fallback).
>
> **`GET /payments/order/:orderId`:** Returns transactions for the order itself PLUS any group transactions (via `order_group_id`), merged and deduplicated.
>
> **`GET /payments/admin/order/:orderId`:** Same merged/deduplicated result, but resolves the order **without owner scope** (`OrderService.findOrderForPaymentAdmin`) so an admin can view any order's transactions from the admin order detail page. Guarded by **`payments:read`** — a permission held **only by admin** (not seller/shipper, who hold `orders:read`), so seller/shipper are locked out (`AUTH_004 (403)`) even though the route lives under `/payments`. Unknown order → `ORDER_001 (404)`.
>
> **Retry:** If payment fails or times out, customer can call `POST /payments/create` again — creates a new `payment_transactions` record. Each order/group can have multiple transactions.
>
> **Timeout cron:** Every 5 minutes, transactions pending for 15+ minutes are marked as `failed`. Order `payment_status` stays `unpaid` (user can retry).
>
> **PaymentMethod values:** `cod`, `vnpay`, `momo` (formerly `banking`, renamed to `vnpay`).

---

## 7. Admin Endpoints

All admin endpoints use **permission-based access control** via `@Permissions()` decorator. Each endpoint requires a specific `resource:action` permission (e.g. `@Permissions(PERMISSIONS.PRODUCTS_CREATE)`). Accessing without the required permission returns `AUTH_004 (403)`.

### Admin: Role Management — `/api/v1/admin/roles`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/roles` | List all roles with user count | `roles:read` |
| GET | `/admin/roles/:id` | Get role detail with user count | `roles:read` |
| POST | `/admin/roles` | Create a new role | `roles:create` |
| PATCH | `/admin/roles/:id` | Update role name | `roles:update` |
| DELETE | `/admin/roles/:id` | Delete role (fails if users assigned or system role) | `roles:delete` |
| GET | `/admin/roles/:id/permissions` | List role's permissions | `roles:read` |
| PUT | `/admin/roles/:id/permissions` | Sync (replace all) permissions for a role | `roles:update` |
| POST | `/admin/roles/:id/permissions` | Add permissions to role | `roles:update` |
| DELETE | `/admin/roles/:id/permissions` | Remove permissions from role | `roles:update` |

> **Escalation prevention:** Cannot assign permissions you don't have (`PERMISSION_004`). Cannot modify your own role's permissions (`PERMISSION_005`). System roles (`is_system = true`) cannot be deleted (`PERMISSION_006`).

### Admin: Permission Management — `/api/v1/admin/permissions`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/permissions` | List all permissions (filter by `?resource=`) | `permissions:read` |
| GET | `/admin/permissions/:id` | Get permission by ID | `permissions:read` |
| POST | `/admin/permissions` | Create permission | `permissions:create` |
| PATCH | `/admin/permissions/:id` | Update permission (name, description) | `permissions:update` |
| DELETE | `/admin/permissions/:id` | Delete permission (fails if assigned to roles) | `permissions:delete` |

### Admin: User Management — `/api/v1/admin/users`

| Method | Path | Description | Filter/Sort |
|--------|------|-------------|-------------|
| GET | `/admin/users` | List all users (paginated) | `?search=keyword&role=customer&is_active=true&sort=created_at&order=desc` |
| GET | `/admin/users/:id` | Get user detail (profile + order count + review count) | — |
| PATCH | `/admin/users/:id/activate` | Toggle `is_active` (soft ban/unban) | — |
| PATCH | `/admin/users/:id/role` | Change user role | — |

> **Note:** Admin cannot edit user profile (full_name, phone, password) — only the user themselves via `/users/me`. Admin can only ban/unban and change roles. Respects auth feature boundary: admin manages identity-level attributes, not profile data.

### Admin: Category Management — `/api/v1/admin/categories`

| Method | Path | Description | Filter/Sort |
|--------|------|-------------|-------------|
| GET | `/admin/categories` | List all categories flat (paginated, includes product count) | `?search=keyword&parent_id=5&sort=name&order=asc` |
| GET | `/admin/categories/:id` | Get category detail (parent info + direct children + product count) | — |
| POST | `/admin/categories` | Create category (name, slug, parent_id?) | — |
| PATCH | `/admin/categories/:id` | Update category (name, slug, parent_id) | — |
| DELETE | `/admin/categories/:id` | Delete category (fails if has products or children) | — |

### Admin: Product Management — `/api/v1/admin/products`

| Method | Path | Description | Filter/Sort |
|--------|------|-------------|-------------|
| GET | `/admin/products` | List all products including inactive (paginated) | `?search=keyword&category_id=5&is_active=true&sort=created_at&order=desc` |
| GET | `/admin/products/:id` | Get product detail (variants + images + review stats) | — |
| POST | `/admin/products` | Create product (name, slug, category_id, description, thumbnail_url) | — |
| PATCH | `/admin/products/:id` | Update product (name, slug, category_id, description, thumbnail_url) | — |
| PATCH | `/admin/products/:id/activate` | Toggle `is_active` (show/hide from storefront) | — |
| POST | `/admin/products/:id/variants` | Add variant (sku, color, size, price, sale_price, stock_quantity) | — |
| PATCH | `/admin/variants/:id` | Update variant (price, sale_price, stock_quantity, color, size) | — |
| DELETE | `/admin/variants/:id` | Delete variant (fails if referenced by active cart_items) | — |
| POST | `/admin/products/:id/images` | Add image (image_url, sort_order) | — |
| PATCH | `/admin/images/:id` | Update image sort_order | — |
| DELETE | `/admin/images/:id` | Delete image | — |

### Admin: Order Management — `/api/v1/admin/orders`

| Method | Path | Description | Filter/Sort |
|--------|------|-------------|-------------|
| GET | `/admin/orders` | List all orders (paginated) | `?search=keyword&status=pending&payment_status=unpaid&user_id=123&sort=created_at&order=desc` |
| GET | `/admin/orders/:id` | Get order detail + order_items + user info + `applied_coupons[]` | — |
| PATCH | `/admin/orders/:id/status` | Update order status (valid transitions only) | — |
| PATCH | `/admin/orders/:id/payment-status` | Update payment status (unpaid → paid) | — |

> **Valid status transitions (admin):** `pending → confirmed → shipping → delivered → completed`, `pending → cancelled`, `confirmed → cancelled`, `shipping → cancelled`, `return_requested → completed`, `return_requested → cancelled`. Invalid transitions (e.g. `delivered → pending`) return `ORDER_003 (400)`.
>
> **Customer status transitions:** `pending → cancelled`, `delivered → completed` (confirm receipt), `delivered → return_requested` (return request). Customer endpoints: `PATCH /orders/:id/cancel`, `PATCH /orders/:id/confirm-receipt`, `PATCH /orders/:id/return-request`.
>
> **Auto-complete:** Orders in `delivered` status for 7+ days are automatically moved to `completed` via hourly cron job. Revenue (dashboard) counts `completed` orders only.

### Admin: Review Management — `/api/v1/admin/reviews`

| Method | Path | Description | Filter/Sort |
|--------|------|-------------|-------------|
| GET | `/admin/reviews` | List all reviews (paginated) | `?product_id=10&user_id=5&rating=1&sort=created_at&order=desc` |
| DELETE | `/admin/reviews/:id` | Delete any review (moderation) | — |

### Admin: Wishlist — `/api/v1/admin/wishlist`

| Method | Path | Description | Filter/Sort |
|--------|------|-------------|-------------|
| GET | `/admin/wishlist/popular` | Most wishlisted products (paginated, with counts) | — |

### Admin: Coupon Management — `/api/v1/admin/coupons`

| Method | Path | Description | Filter/Sort |
|--------|------|-------------|-------------|
| GET | `/admin/coupons` | List all coupons — platform + shop (paginated) | `?search=keyword&scope=categories&discount_type=percentage&is_active=true&owner=platform\|shop&shop_id=5&sort=created_at&order=desc` |
| GET | `/admin/coupons/usages` | List all coupon usages (paginated) | `?coupon_id=5&user_id=123` |
| GET | `/admin/coupons/:id` | Get coupon detail (includes applicable categories/products) | — |
| POST | `/admin/coupons` | Create coupon (code, scope, category_ids/product_ids) | — |
| PATCH | `/admin/coupons/:id` | Update coupon (code is immutable) | — |
| DELETE | `/admin/coupons/:id` | Soft-delete (set `is_active = false`; sticky `admin_disabled` lock for shop coupons) | — |
| PATCH | `/admin/coupons/:id/unlock` | Clear the admin lock on a shop coupon (`admin_disabled = 0`); leaves `is_active` untouched | `coupons:update` |
| GET | `/admin/coupons/:id/usages` | List usages for a specific coupon (paginated) | — |

> **Scope types:** `all` (entire order), `categories` (specific categories + sub-categories), `products` (specific products). Junction tables `coupon_categories` and `coupon_products` are managed automatically on create/update. Code is stored uppercase and immutable after creation.
>
> **Platform vs shop coupons:** Admin `POST /admin/coupons` always creates a **platform** coupon (`shop_id = NULL`). The admin list shows both platform and shop coupons — filter with `?owner=platform|shop` or `?shop_id=`, and each row exposes `shop_id` + `shop {id, name}` (`null` = platform) and `admin_disabled`. Admin may **deactivate** shop coupons (moderation via `DELETE`) but cannot edit their content or reassign their shop.
>
> **Admin lock (sticky moderation):** Deactivating a **shop** coupon via `DELETE` sets `admin_disabled = 1` (in addition to `is_active = false`). While locked, the owning seller cannot edit or re-enable it (`COUPON_013`), and it validates as inactive (`COUPON_006`). `PATCH /admin/coupons/:id/unlock` clears **only** the lock (`admin_disabled = 0`) — it does **not** reactivate the coupon (`is_active` is left as-is). Unlocking means "stop moderating"; the owning seller then decides whether to turn the coupon back on. Platform coupons keep the plain `is_active` toggle (no lock).

### Admin: Upload — `/api/v1/upload`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| POST | `/upload/image` | Upload image file (JPEG/PNG/WebP, max 5MB) | `uploads:create` |

> **Content-Type:** `multipart/form-data` (exception to the global `application/json` default). Returns `{ url: "..." }` with the saved image path.

### Admin: Shop Management — `/api/v1/admin/shops`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/shops` | List all shops (paginated, filterable by status) | `shops:read` |
| GET | `/admin/shops/:id` | Get shop detail with product count | `shops:read` |
| PATCH | `/admin/shops/:id/status` | Change shop status (active/suspended/banned) | `shops:update` |

> **Status transitions:** Admin can set status to `active`, `suspended`, or `banned`. Setting to `active` populates `verified_at`/`verified_by` if not already set. `suspended_at`/`banned_at` are updated on each respective status change.

### Admin: Dashboard — `/api/v1/admin/dashboard`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/dashboard` | Dashboard analytics: summary stats, revenue trend, order status, recent orders, users by role, top products, low stock alerts, attention signals, top shops (`?period=7d\|30d\|90d\|12m`, default 30d) | `dashboard:read` |

> **Partial failure tolerance:** Uses `Promise.allSettled()` — if one query fails, other sections still return. Failed sections return `null` or `[]`. Response includes 9 data sections: `summary`, `revenueOverTime`, `ordersByStatus`, `recentOrders`, `usersByRole`, `topProducts`, `lowStockAlerts`, `attentionSignals`, `topShops`.
>
> **`?period=7d|30d|90d|12m`** (default `30d`) sets the time window. `revenueOverTime` buckets by **day** for `7d/30d/90d` and by **calendar month** for `12m` (points returned as `yyyy-MM-01`). The `summary` **flow metrics** (`grossRevenue`, `collectedRevenue`, `totalOrders` — excludes cancelled) are scoped to the selected period and each carries a `*Change` object `{ changePercent: number | null, direction: 'up'|'down'|'flat' }` comparing against the previous equal-length window (`changePercent` is `null` when the previous window was zero). `totalProducts` / `totalUsers` remain absolute current snapshots (no change).
>
> **`attentionSignals`** = `{ pendingShops, returnRequestedOrders }` (admin operator queue). **`topShops`** = top 5 shops by completed+paid revenue `{ id, name, slug, revenue, orderCount }`.

---

## 8. Seller Endpoints

All seller endpoints use **permission-based access control** via `@Permissions()` decorator. Seller role has `products:*`, `categories:read`, `orders:read`, `orders:update`, `uploads:create`, `dashboard:read`, `shops:create`, `shops:read`, `shops:update` permissions.

### Seller: Orders — `/api/v1/seller/orders`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/seller/orders` | List orders for seller's shop (paginated, filterable by status/payment_status) | `orders:read` |
| GET | `/seller/orders/:id` | Get order detail (seller's shop only) + `applied_coupons[]` | `orders:read` |
| PATCH | `/seller/orders/:id/status` | Update order status (seller transitions: pending→confirmed) | `orders:update` |
| PATCH | `/seller/orders/:id/payment-status` | Update payment status (unpaid → paid) | `orders:update` |

> **Shop-scoped access:** Each order has a `shop_id` — seller endpoints filter directly by `orders.shop_id` matching the seller's shop. No subquery through `order_items` needed.
>
> **Status transitions (seller):** `pending → confirmed`. Other transitions (shipping, delivered) are handled by shipper or admin.
>
> **Notifications:** Status updates emit `order.status_updated` event → customer receives notification.

### Seller: Dashboard — `/api/v1/seller/dashboard`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/seller/dashboard` | Dashboard analytics: summary stats, revenue trend, order status breakdown, top products, recent orders (`?period=7d\|30d\|90d\|12m`, default 30d) | `dashboard:read` |

> **Partial failure tolerance:** Uses `Promise.allSettled()` — same pattern as Admin dashboard. Revenue counts `completed` orders only, filtered by seller's `shop_id`.
>
> **`?period=`** behaves exactly like the admin dashboard: same values/default, day-vs-month bucketing for `revenueOverTime`, and period-scoped `summary` flow metrics (`grossRevenue`, `collectedRevenue`, `totalOrders`) each with a `*Change` object vs the previous window. `totalProducts` / `lowStockCount` stay absolute snapshots. Seller response has **no** `attentionSignals` / `topShops` (admin-only).

### Seller: Coupons — `/api/v1/seller/coupons`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/seller/coupons` | List the seller's own shop coupons (paginated, searchable) | `coupons:read` |
| GET | `/seller/coupons/:id` | Get shop coupon detail (own shop only) | `coupons:read` |
| POST | `/seller/coupons` | Create shop coupon (scope `all`/`products`; code auto-prefixed with shop slug) | `coupons:create` |
| PATCH | `/seller/coupons/:id` | Update shop coupon (code & shop immutable, own shop only) | `coupons:update` |
| DELETE | `/seller/coupons/:id` | Deactivate shop coupon (soft delete, own shop only) | `coupons:delete` |
| GET | `/seller/coupons/:id/usages` | List usages for a shop coupon (own shop only) | `coupons:read` |

> **Shop coupons:** Every seller endpoint resolves the caller's shop (`SHOP_004` if none) and hard-scopes to `coupons.shop_id = shop.id`. Ownership is enforced on every read/mutation — touching a platform coupon or another shop's coupon returns `COUPON_010 (403)`.
>
> **Scope:** Limited to `all` (whole shop) or `products` (specific products **of that shop** — validated on create and update, else `COUPON_009 (400)`). `categories` is not available to sellers.
>
> **Code namespace:** The final stored code is `<shop-slug>-<CODE>`, uppercased, globally UNIQUE (`COUPON_007` on duplicate). Seller-supplied `code` is capped at 30 chars; if the prefixed code would exceed 50 chars → `COUPON_012 (400)`.
>
> **Validity:** A shop coupon only validates while its owning shop is `active` (suspended/banned → `COUPON_006`). An admin-locked coupon (`admin_disabled = 1`) also validates as inactive (`COUPON_006`) and cannot be edited or re-enabled by the seller (`COUPON_013`).
>
> **Checkout (multi-coupon):** A customer may stack **one platform coupon + one coupon per shop** (`coupon_codes[]`; violations → `COUPON_011`). A shop coupon discounts **only its own shop's items**; its whole discount lands on that shop's sub-order. A platform coupon is split across shops by each shop's applicable subtotal (largest-remainder rounding so parts sum exactly), filling only the headroom left after any shop coupon. Per-user usage counts distinct `order_group_id`. On cancel: a shop coupon is reversed as soon as its sub-order is cancelled; a platform coupon only when all group orders are cancelled (both idempotent).

---

## 9. Shipper Endpoints

All shipper endpoints use **permission-based access control** via `@Permissions()` decorator. Shipper role has `orders:read`, `orders:update`, `dashboard:read` permissions.

### Shipper: Orders — `/api/v1/shipper/orders`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/shipper/orders` | List orders (filter: `available` or `my_deliveries`) | `orders:read` |
| GET | `/shipper/orders/:id` | Get order detail (available orders + own deliveries) | `orders:read` |
| PATCH | `/shipper/orders/:id/accept` | Accept order — assigns shipper + confirmed → shipping | `orders:update` |
| PATCH | `/shipper/orders/:id/deliver` | Mark delivered — shipping → delivered | `orders:update` |

> **Order assignment model:** First-come-first-served. Shipper calls `/accept` on a `confirmed` order with no shipper assigned. Atomic conditional UPDATE prevents race conditions — if two shippers accept simultaneously, only one succeeds; the other receives `ORDER_003 (400)`.
>
> **Filter param:** `?filter=available` (default) returns orders with `status = 'confirmed' AND shipper_id IS NULL`. `?filter=my_deliveries` returns orders assigned to the current shipper, with optional `?status=` sub-filter.
>
> **Payment guard on deliver:** COD orders can always be marked delivered. VNPay/MoMo orders must have `payment_status = 'paid'` before marking as delivered — otherwise returns `ORDER_003 (400)`.
>
> **Notifications:** Accept and deliver both emit `order.status_updated` event → customer receives notification.

### Shipper: Dashboard — `/api/v1/shipper/dashboard`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/shipper/dashboard` | Dashboard stats: summary, deliveries over time, recent deliveries (`?period=7d\|30d\|90d\|12m`, default 30d) | `dashboard:read` |

> **Partial failure tolerance:** Uses `Promise.allSettled()` — same pattern as Admin/Seller dashboards. Response includes 3 data sections: `summary` (totalDelivered, activeDeliveries, availableForPickup, deliveredToday), `deliveriesOverTime`, `recentDeliveries` (last 10).
>
> **`?period=7d|30d|90d|12m`** (default `30d`) sets the time window, same values/default and day-vs-month bucketing as the admin/seller dashboards. `summary.totalDelivered` is **period-scoped** (deliveries whose `delivered_at` falls in the window) and carries a `totalDeliveredChange` object `{ changePercent: number | null, direction: 'up'|'down'|'flat' }` comparing against the previous equal-length window. `activeDeliveries`, `availableForPickup`, `deliveredToday` remain **live snapshots** (no period, no change). `deliveriesOverTime` buckets by **day** for `7d/30d/90d` and by **calendar month** for `12m` (points returned as `yyyy-MM-01`).

