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
| SHOP_006 | 400 | Decoration config exceeds size limit (serialized JSON > 16 KB) |
| NOTIFICATION_001 | 404 | Notification not found |
| CHAT_001 | 404 | Conversation not found |
| CHAT_002 | 403 | Not a participant in this conversation |
| CHAT_003 | 400 | Cannot start a conversation with your own shop |
| CHAT_004 | 400 | Message content empty or exceeds 2000 characters |
| CHATBOT_001 | 404 | AI conversation not found |
| CHATBOT_002 | 400 | Message empty or exceeds 2000 characters (or missing session/JWT) |
| CHATBOT_003 | 403 | Conversation does not belong to the caller (owner mismatch) |
| CHATBOT_004 | 503 | AI chatbox not configured (missing OpenRouter API key) |
| CHATBOT_005 | 400 | AI chatbox is disabled by admin |
| PAYMENT_001 | 400 | Order not eligible for payment (COD, cancelled, already paid) |
| PAYMENT_002 | 400 | Active payment already pending for this order |
| PAYMENT_003 | 404 | Payment transaction not found |
| PAYMENT_004 | 400 | Invalid gateway signature |
| PAYMENT_005 | 400 | Amount mismatch |
| PAYMENT_006 | 502 | Gateway API error |
| FLASH_SALE_001 | 404 | Flash sale campaign not found |
| FLASH_SALE_002 | 404 | Flash sale item/registration not found |
| FLASH_SALE_003 | 400 | Invalid window (require registration_starts < registration_ends ≤ starts < ends) |
| FLASH_SALE_004 | 409 | Variant already registered (non-rejected) in the campaign |
| FLASH_SALE_005 | 400 | Variant already in an overlapping campaign |
| FLASH_SALE_006 | 400 | Flash item sold out or insufficient quantity |
| FLASH_SALE_007 | 400 | flash_quantity below already-sold quantity |
| FLASH_SALE_008 | 403 | Registration not owned by the seller's shop |
| FLASH_SALE_009 | 400 | Campaign not open for registration (outside window / not scheduled) |
| FLASH_SALE_010 | 400 | Variant does not belong to the seller's shop |
| FLASH_SALE_011 | 400 | Flash price ≥ original, or below the campaign's minimum discount |
| FLASH_SALE_012 | 400 | Cannot approve: variant already approved in an overlapping campaign |
| FLASH_SALE_013 | 400 | Invalid registration status (edit/withdraw/approve requires the right state) |
| COIN_001 | 400 | Insufficient coin balance at redemption time (concurrency race in `redeemForCheckout`; validation otherwise clamps) |
| COIN_003 | 400 | Invalid coin amount (must be a non-negative integer) |
| SETTINGS_001 | 400 | Invalid settings value |
| SELLER_APP_001 | 404 | Seller application not found |
| SELLER_APP_002 | 409 | User is already a seller (has a shop / seller role) |
| SELLER_APP_003 | 409 | A pending application already exists for this user |
| SELLER_APP_004 | 400 | Application not in a reviewable (pending) state |
| WALLET_001 | 404 | Withdrawal request not found |
| WALLET_002 | 400 | Insufficient wallet balance for withdrawal |
| WALLET_003 | 400 | Withdrawal not in a reviewable (pending) state |

> **Coin redemption clamps, it does not reject.** The requested `coins_to_redeem` is resolved to `min(requested, cap, balance)` (cap = 50% of the post-coupon items total). Exceeding the cap or balance is **not** an error — the client's cap is an estimate (computed without flash prices / exact multi-coupon allocation), so an over-request is silently clamped and the applied amount is echoed as `coins_applied`. A disabled feature (`coin.enabled=false`) silently ignores redemption (redeems 0). Only a non-integer request is a hard error (`COIN_003`, defensive — the DTO already enforces `@IsInt`), plus the rare `COIN_001` if the balance is spent by a concurrent checkout between validation and consumption.

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
| GET | `/products` | List active products (paginated, filtered, sorted). Accepts `?ids=1,2,3` (CSV, max 100) to bulk-fetch a specific set of active products — used by Recently Viewed (guest) and Product Comparison | Public |
| GET | `/products/suggestions` | Search suggestions for a keyword (`?q=`) — grouped products / categories / shops (Module 12) | Public |
| POST | `/products/search-by-image` | Visual search — upload an image, AI extracts attributes → similar products (Module 12) | Public |
| GET | `/products/:slug` | Get product detail (variants + images + shop info) | Public |

> **Bulk `?ids=` path (Recently Viewed guest hydration + Product Comparison):** when `ids` is present the endpoint returns the **full requested set in one call** (no pagination trimming — `meta` is `{ page: 1, limit: ids.length, total, totalPages: 1 }`) and each item is enriched with `avgRating` + `reviewCount` (via one batched grouped query over `reviews`) alongside the joined `category` object. The normal (no-`ids`) listing is unchanged — no stats, standard pagination — so existing consumers are unaffected. Inactive products / products of non-active shops are dropped (visibility filter), so the returned set may be smaller than the requested ids.
>
> **Visual Search (`POST /products/search-by-image`, Module 12):** `multipart/form-data` with an image file (JPEG/PNG/WebP, ≤5MB). The backend sends the image to **OpenRouter** (vision model) to extract `{ category, color, material, style }`, builds a dynamic `WHERE` query, and returns matching active products plus the AI-detected tags for display. Rate-limited to **10 requests/min/user** (`@nestjs/throttler`, in-memory) → `429` on exceed.

### Homepage — `/api/v1/homepage`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/homepage` | Aggregated storefront home data: Special Offers, Best Sellers, Trending, Discover More | Public |

> **Bonus feature (outside the 26 core modules).** One call returns the curated product blocks for the home page (each block a product-list-item array, same shape as `GET /products`), so the landing page renders without several round-trips. Served by the dedicated `homepage/` feature module.

### Shop — `/api/v1/shops`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/shops` | List active shops (paginated, searchable) | Public |
| GET | `/shops/:slug` | Get shop profile with stats (product_count, average_rating, total_sales) + parsed `decoration_config` | Public |
| GET | `/shops/:slug/products` | List shop's products (paginated, filtered) | Public |

> **Shop Decoration (`decoration_config`):** `GET /shops/:slug` and `GET /seller/shop` return `decoration_config` as a **parsed object** (`{ version, theme?, blocks[] }`) or `null` (default layout / never decorated / malformed → degraded to null). The storefront renders decoration blocks **above** the always-present "All Products" catalog (decoration is additive, never a replacement). Block types: `hero` / `rich_text` / `image` / `product_grid`.

### Seller Shop — `/api/v1/seller/shop`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/seller/shop` | Get current seller's shop (incl. parsed `decoration_config`) | `shops:read` |
| POST | `/seller/shop` | Create shop (one per seller; slug auto-generated, immutable) | `shops:create` |
| PATCH | `/seller/shop` | Update shop (name, description, logo_url, banner_url, `decoration_config`; slug immutable) | `shops:update` |

> **Updating decoration (`PATCH /seller/shop`):** the body accepts an optional `decoration_config` — a full validated envelope `{ version: 1, theme?: { accent? }, blocks: [{ id, type, data }] }` to save the layout, or `null` to reset to the default. Validated by nested class-validator DTOs (unknown block type / extra field / >20 blocks / hero not 1–5 images / grid not 1–12 unique ids → `422 VALIDATION_001` + `details[]`); the serialized JSON is additionally capped at 16 KB (`SHOP_006`). Omitting the key leaves the existing decoration unchanged. `product_grid` pins reference the seller's own product ids and are hydrated for the storefront via `GET /products?ids=` (visibility-filtered).

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
| GET | `/orders/:id/tracking` | Order tracking — status timeline + latest shipper location (own only, Module 16) | Customer |
| PATCH | `/orders/:id/cancel` | Cancel order (if status = pending) | Customer |
| PATCH | `/orders/:id/confirm-receipt` | Confirm receipt — delivered → completed | Customer |
| PATCH | `/orders/:id/return-request` | Request return/refund — delivered → return_requested | Customer |

> **Order Tracking (`GET /orders/:id/tracking`, Module 16):** returns the status **timeline** (from `order_status_history` — each transition with actor + timestamp) plus the shipper's **latest location** (from `order_tracking_locations`) and the snapshotted delivery address (lat/lng). The frontend renders the timeline always, and a Leaflet + OpenStreetMap map (shipper marker + delivery marker) only while the order is `shipping`. The shipper updates their position manually via `PATCH /shipper/orders/:id/location`. The same tracking payload is available to the seller/admin/shipper who own or handle the order.
>
> **Multi-shop checkout:** `POST /orders` splits the cart into N orders (1 per shop), all sharing the same `order_group_id` (UUID v4). Returns `CheckoutResponseDto { order_group_id, orders[], total_amount }`. Coupon discount is distributed across sub-orders (see below). Each order has its own `shop_id`, `shop_name` (snapshot), `shipping_fee`, and `total_amount`.
>
> **Multi-coupon (Phase 2):** `POST /orders` accepts `coupon_codes?: string[]` — at most **one platform coupon** plus **one coupon per shop** (violations → `COUPON_011 (400)`). The legacy single `coupon_code?: string` is still accepted and mapped into the array. Each coupon is validated and calculated independently on the original subtotal. Per sub-order the discount is `shopCouponDiscount + platformShareAdj`, where the shop coupon lands first and the platform coupon's share (split across shops by applicable subtotal, largest-remainder rounding) fills the remaining headroom (`platformShareAdj = min(platformShare, shopItemsTotal − shopCouponDiscount)`). `orders.coupon_code` snapshots a single code (shop coupon preferred, else platform); the full breakdown is returned on order detail as `applied_coupons: [{ code, discount_amount }]` and sourced from `coupon_usages`.
>
> **Coupon reversal:** A **shop coupon** is reversed as soon as its own sub-order is cancelled. A **platform coupon** is reversed only when ALL orders in the group are cancelled; `current_uses` is decremented once per coupon. Both are idempotent.
>
> **Platform-discount waterfall:** When a shop coupon consumes most of a shop's headroom, that shop's platform share is capped at `min(applicable, headroom)` and the **leftover is redistributed** to shops that still have room (largest-remainder rounding). The platform discount is never silently lost — the total given equals `min(nominal, Σ per-shop caps)`. `checkout` and `POST /orders/preview` share the same pure distributor, so the preview always matches what checkout charges.
>
> **`POST /orders/preview`** returns `CheckoutPreviewResponseDto { subtotal, discount_total, coin_discount, coins_applied, shipping_total, grand_total, shops[], applied_coupons[] }`. Body is `{ coupon_code?, coupon_codes?, coins_to_redeem? }` (same coupon fields as checkout, plus Xu). It is **advisory, exact-at-the-time — NOT a reservation**: it writes nothing (no `coupon_usages`, no coin consumption, no stock/usage hold), and `POST /orders` re-validates and remains the sole source of truth (a coupon may run out, or the balance change, in between). Invalid coupons return the same `COUPON_0xx` errors as checkout.
>
> **Coin redemption (Module 23):** `POST /orders` and `POST /orders/preview` accept `coins_to_redeem?: number` (integer Xu). The amount is **clamped** to `min(requested, 50% of the post-coupon items total, balance)` — an over-request is not an error (see COIN codes above), a disabled feature ignores it, and only a non-integer is rejected (`COIN_003`). The accepted Xu is distributed across shop sub-orders by headroom (`itemsTotal − couponDiscount`) with the same `allocateWithCaps` distributor as the platform coupon, so the **actually-applied** total (`coins_applied`, echoed by preview) may be **less** than requested when a large coupon leaves little room. Each order snapshots its share in `orders.coin_discount`; the sub-order formula becomes `total_amount = shopItemsTotal − discount_amount − coin_discount + shipping_fee`. Redemption is consumed FIFO (soonest-to-expire batch first) atomically inside the checkout transaction.

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

### Recently Viewed — `/api/v1/recently-viewed`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/recently-viewed` | List my recently-viewed products (newest first, max 20) | Customer |
| POST | `/recently-viewed` | Record a product view (`{ product_id }`; 204) | Customer |
| POST | `/recently-viewed/merge` | Merge guest (localStorage) history (`{ items: [{ product_id, viewed_at }] }`, max 50) | Customer |

> **Guest vs customer:** Guests are tracked entirely on the frontend (localStorage, newest 20). On login the list is POSTed to `/recently-viewed/merge` (mirrors cart merge) and cleared. The carousel renders on Home, Product Detail, and Cart. All three endpoints return the same **product-list-item** shape as `GET /products` (Product + variants/images), so the guest path (hydrated via `GET /products?ids=`) and the customer path render identically. `GET /recently-viewed` and merge are visibility-filtered (only `is_active` products of `active` shops), so a product deactivated after viewing drops out. Recording a view UPSERTs on `(user_id, product_id)` — a re-view bumps `viewed_at` (no duplicate) and the list is trimmed to the newest 20. Unknown/inactive product on record → `PRODUCT_001 (404)`.

### Coin (Hoàn Xu) — `/api/v1/coins`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/coins/balance` | My spendable Xu balance + batches expiring within 30 days | Customer |
| GET | `/coins/transactions` | My Xu ledger (paginated, newest first) | Customer |

> **Cashback coins (Module 23).** 1 Xu = 1 ₫ (integer). Customers **earn** Xu when an order reaches `completed` (`floor((total_amount − shipping_fee) × earn_rate%)`), **redeem** Xu at checkout via `coins_to_redeem` on `POST /orders` (and `/orders/preview`), and Xu **expires** per batch after `expiry_days`. `GET /coins/balance` returns `{ balance, expiring_soon: [{ amount, expires_at }] }`; `GET /coins/transactions` returns rows `{ id, type, amount, order_id, note, created_at }` where `type ∈ { earn, redeem, expire, reverse_earn, refund }` and `amount` is a positive magnitude (sign implied by type). Config is admin-controlled — see `/admin/settings/coins`.

### Seller Application (Onboarding) — `/api/v1/seller-applications`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/seller-applications` | Apply to become a seller (shop_name, phone, business_name?, tax_id?, description?, logo_url?, banner_url?) | Customer |
| GET | `/seller-applications/me` | My latest application (`data: null` if never applied) | Customer |

> **Seller onboarding (Module 24).** A customer submits an application; admin reviews it. At most **one pending** application per user (`SELLER_APP_003`); a user who already has a shop / seller role is blocked (`SELLER_APP_002`). Approval grants the `seller` role and creates an **active** shop (skips `pending_verification` — the review is the vetting). After approval the caller's JWT still carries the old role until refreshed, so the frontend refreshes the token + profile before entering the Seller Center.

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

> **Delivery — realtime push + polling fallback:** Notifications are pushed in realtime over **Socket.IO** (`NotificationGateway`, JWT verified in the WS handshake, room `user:{id}`, event `new_notification`) — the same shared gateway/connection reused by Chat (Module 20). The REST endpoints remain the cold-load + fallback path: the frontend polls `GET /notifications/unread-count` (~30s) for the badge when the socket is not yet connected, and loads the paginated list / marks read over REST. Notifications are created automatically via the `order.status_updated` event. Admin/seller status changes notify the customer. Customer-initiated confirm receipt and return requests notify the seller(s). Customer-initiated order placement and cancellation do **not** create notifications.

### Chat — `/api/v1/chat`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/chat/conversations` | Start or get a conversation with a shop (`{ shop_id }`; idempotent) | Customer |
| GET | `/chat/conversations` | List my conversations (customer + seller sides), each with counterpart, last message + unread | Customer/Seller |
| GET | `/chat/conversations/:id/messages` | Paginated message history (newest-first; membership enforced) | Customer/Seller |
| POST | `/chat/conversations/:id/messages` | Send a message (`{ content }`, ≤2000 chars) | Customer/Seller |
| PATCH | `/chat/conversations/:id/read` | Mark conversation read — reset unread, emit receipts (204) | Customer/Seller |
| GET | `/chat/unread-count` | Total unread messages for the header badge (`{ count }`) | Customer/Seller |

> **Realtime Customer ↔ Seller chat** (Module 20). All endpoints are JWT-auth only (no RBAC permission) — access is gated by **membership**: the caller must be the conversation's `customer_id` or own its `shop_id` (`CHAT_002` otherwise). A customer cannot chat with their own shop (`CHAT_003`). `sender_type` (`customer`/`seller`) is derived server-side, never trusted from the client.
>
> **Shared Socket.IO gateway** (default namespace `/`, JWT verified in the WS handshake — the same shared client socket as Notifications, not a second connection). The `ChatGateway` runs its own handshake verify. Rooms: `user:{id}` (personal, drives the badge) and `conversation:{id}` (per thread). **Persist-then-emit:** the REST call persists the message, then the gateway emits it. Initial receipt status is resolved from the recipient's live presence — in the conversation room ⇒ `read`, merely online ⇒ `delivered`, else `sent`; `PATCH …/read` promotes to `read`.
>
> **Socket events:** `chat:new_message` (server → conversation room + recipient `user:{id}`) carries the message DTO; `chat:read` `{ conversationId, status }`; `chat:typing` `{ conversationId, userId, isTyping }` (client ↔ server); `chat:presence` `{ conversationId, userId, online }`; `chat:join` / `chat:leave` `{ conversationId }` (client → server, membership-checked). Chat unread is **independent** of notifications — no `notifications` rows are created for chat; the badge cold-loads from `GET /chat/unread-count`.

### AI Chatbox — `/api/v1/ai`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/ai/config` | Whether the storefront chatbox is enabled (FE gate) | Public |
| POST | `/ai/chat` | Send a message → `{ conversation_id, reply, products[], actions?[] }` | Public (guest `x-session-id` / customer JWT) |
| GET | `/ai/conversations/:id` | Get a conversation (own only) to resume | Public (owner-scoped) |

> **AI Shopping Agent (Module 21).** Floating storefront assistant for **guest + customer**. Beyond RAG suggestions + policy FAQ, it is a **tool-calling agent** that can *act* on the shopper's behalf: search products, add/update/remove cart items, list available coupons, look up & cancel (pending) orders, list addresses, and **propose checkout**. `POST /ai/chat` body is `{ message: string(≤2000), conversation_id?: number }`; the response is `{ conversation_id, reply, products[], actions?[] }`. Both turns are **persisted** (`ai_conversations` / `ai_messages` — the assistant turn snapshots `product_ids` **and** `actions`) so Admin can review them and the thread can resume with its cards intact.
>
> **Tool-calling loop (human-in-the-loop):** each `POST /ai/chat` runs a bounded loop (≤ **4** LLM rounds). When the model returns `tool_calls`, the backend `ToolDispatcher` executes them against the real feature services (`ProductService` / `CartService` / `OrderService` / `UserProfileService` / `CouponService`) using the request-derived owner — **tool args are never trusted for identity** — feeds results back, and loops. Read tools and cart-writes run **automatically**; identical tool calls are de-duplicated to avoid double side-effects. The `add_to_cart` tool + system prompt require every variant axis (e.g. colour AND size) to be chosen before adding — the agent asks for a missing option instead of guessing a value, using `ask_choice` to render tap-to-answer chips. `list_coupons` (customer-only; `getAvailableCouponsForCart`) lets the agent surface eligible vouchers and pass chosen codes into `propose_checkout.coupon_codes`. `ask_choice({ question, options[] })` is a no-side-effect, guest-safe tool that emits a `quick_replies` action.
>
> **`actions[]`** are the agent's UI cards, each `{ type, data }`: `cart_updated` (cart summary after a cart write), `checkout_proposal` (advisory `previewCheckout` totals + chosen `coupon_codes`/`coins_to_redeem`), `order_cancelled` (`{ order_id, status }`), `needs_login` (a guest hit a customer-only tool → `{ tool }`), `quick_replies` (`{ prompt?, options: [{ label, value }] }` — tap-to-answer chips from the `ask_choice` tool: variant colour/size or coupon pick; a tap sends the option `value` as the next message). The storefront `checkout_proposal` mini-checkout also has an **inline voucher** field — applying/removing a code re-runs `POST /orders/preview` for exact totals, and the confirmed order sends the edited codes to `POST /orders`. Suggested product cards prefer the agent's `search_products` results, then keyword-seed products **filtered to the dominant category** (a filler-only follow-up like "size M đi" seeds nothing).
>
> **Money is gated:** the `propose_checkout` tool calls `OrderService.previewCheckout` (**advisory, writes nothing**) and returns a `checkout_proposal` — it **never** places an order. The storefront widget renders a **mini-checkout** card (address + payment method) and the customer's explicit confirm calls the existing **`POST /orders`** (then `POST /payments/create` for VNPay/MoMo). The LLM cannot move money.
>
> **Guest gating:** checkout / order-lookup / address / coupon-listing tools require a logged-in user; for a guest they short-circuit to `{ needs_login: true }` (+ a `needs_login` action) instead of touching a service — cart tools still work for guests (session cart).
>
> **Ownership:** a conversation is owned by the customer (`user_id` from JWT) or the guest (`session_id` from the `x-session-id` header, auto-attached by the axios interceptor like the cart). Touching someone else's conversation → `CHATBOT_003 (403)`; unknown id → `CHATBOT_001 (404)`. Order tools are additionally owner-scoped (`findMyOrders`/`findMyOrderById`, `cancelOrder` → `ORDER_004`).
>
> **Rate limit:** `POST /ai/chat` is throttled to **10 requests/min** per user (in-memory `@nestjs/throttler` — the repo has no Redis, see `share-docs/TECH_DEBT.md` TD-001) → `429` on exceed. One message = ≤4 internal LLM rounds (cost cap).
>
> **Provider + fallback:** tool-calling uses `OPENROUTER_AGENT_MODEL` (a function-calling-capable model; falls back to `OPENROUTER_CHAT_MODEL` when unset — the agent then **self-degrades to plain RAG**, since a model that ignores tools just replies with text). A provider/timeout/`429` error mid-loop breaks the loop and returns a **polite reply with HTTP 200** (still persisted, keeping any actions already performed). A missing API key → `CHATBOT_004 (503)`; a disabled chatbox → `CHATBOT_005 (400)`; the system prompt constrains the model to only recommend retrieved products and forbids claiming an order was placed.

### Recommendations — `/api/v1/activity`, `/api/v1/recommendations`, `/api/v1/products/:id/similar|frequently-bought-together`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/activity` | Record one behavioral signal (`{ action, target_type, target_id?, metadata? }`); best-effort, `204` | Public (customer JWT / guest `x-session-id`) |
| GET | `/recommendations` | "Recommended for You" — `{ reason, products[] }` (`?limit=12`) | Public (customer JWT / guest `x-session-id`) |
| GET | `/products/:id/similar` | "Similar Products" — content similarity blended with co-view (`{ products[] }`, `?limit=12`) | Public |
| GET | `/products/:id/frequently-bought-together` | "Frequently Bought Together" — co-purchase, falls back to similar (`{ products[] }`, `?limit=12`) | Public |

> **Smart Recommendations (Module 22).** Content-based personalization for guest + customer, scored **on-demand** (no Redis). Identity is resolved exactly like the AI chatbox / cart — a JWT populates the user owner, else the `x-session-id` header identifies a guest (both auto-attached by the axios interceptor).
>
> **Signal capture is hybrid:** the frontend fires `POST /activity` for `VIEW_PRODUCT` / `VIEW_CATEGORY` / `SEARCH` / `ADD_TO_CART` / `ADD_TO_WISHLIST`, and a server-side `@OnEvent('order.created')` listener logs `PURCHASE` rows (the `order.created` event payload was enriched with an optional `userId`; `ProductService.handleOrderCreated` ignores it). `POST /activity` is **deliberately lenient** — only the DTO enums are validated; a missing identity, or an unknown/stale `target_id`, is a silent no-op (never `204`-blocks the UX).
>
> **Scoring:** a profile is built from the caller's last-90-day rows — a category weight map (`PURCHASE`×5, `ADD_TO_CART`×3, `ADD_TO_WISHLIST`×2, `VIEW`×1), a preferred price range, and preferred shops. Candidates in the preferred categories score `+3` (category) · `+2` (price in range) · `+1` (same shop), excluding already-purchased/interacted products; the result is topped up with best-sellers so a carousel is **never blank**, and a cold-start caller falls back to best-sellers → trending with `reason: null`. `reason` (when present) names the dominant category ("Because you like {category}"). `similar` blends co-view ids (self-join on `user_activity_log`) ahead of content-similar (same/sibling category, price proximity); `frequently-bought-together` ranks co-purchase within the same `order_group_id` on completed orders and falls back to `similar` when sparse. All three surfaces hydrate via `ProductService.findActiveByIdsWithStats` (visibility-filtered, with `avgRating`/`reviewCount`), returning the same **product-list-item** shape as `GET /products`. A daily cron deletes activity rows older than 90 days.

### Flash Sale — `/api/v1/flash-sales`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/flash-sales/active` | List currently-live campaigns (only `approved` items) | Public |
| GET | `/flash-sales/:id` | Get a live campaign detail (only `approved` items; 404 if not live) | Public |

> **Storefront shows only `approved` registrations.** Campaigns with zero approved items are hidden from the active feed. Flash pricing everywhere (product cards, checkout, preview, coupons) is sourced from `FlashSaleService.getActiveFlashPriceMap`, which returns only approved items of a live campaign.

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
| GET | `/admin/orders/:id/tracking` | Order tracking — status timeline + shipper location (Module 16) | — |
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

### Admin: Flash Sale — `/api/v1/admin/flash-sales`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/flash-sales` | List campaigns (paginated, `?search=&status=&is_active=`) | `flash_sales:read` |
| POST | `/admin/flash-sales` | Create an empty campaign (registration window + `min_discount_percent`) | `flash_sales:create` |
| GET | `/admin/flash-sales/registrations` | Global moderation queue (`?status=pending`) | `flash_sales:read` |
| PATCH | `/admin/flash-sales/items/:itemId/approve` | Approve a seller registration | `flash_sales:update` |
| PATCH | `/admin/flash-sales/items/:itemId/reject` | Reject a registration (`{ reason? }`) | `flash_sales:update` |
| DELETE | `/admin/flash-sales/items/:itemId` | Remove a registration (hard delete) | `flash_sales:update` |
| GET | `/admin/flash-sales/:id` | Campaign detail with ALL registrations (any status) | `flash_sales:read` |
| GET | `/admin/flash-sales/:id/items` | List a campaign's registrations (moderation) | `flash_sales:read` |
| PATCH | `/admin/flash-sales/:id` | Update campaign (window, `min_discount_percent`, `is_active`) | `flash_sales:update` |
| DELETE | `/admin/flash-sales/:id` | Delete campaign (cascades registrations) | `flash_sales:delete` |

> **Admin creates empty campaigns and moderates only** — it never adds products directly. Approving runs an overlap guard (`FLASH_SALE_012`) so a variant can't be approved into two time-overlapping campaigns. Approve/reject emit `flash_sale.registration_reviewed` → the owning seller is notified.

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

### Admin: Settings — `/api/v1/admin/settings`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/settings/coins` | Read coin (Hoàn Xu) config | `settings:read` |
| PATCH | `/admin/settings/coins` | Update coin config (partial) | `settings:update` |
| GET | `/admin/settings/commission` | Read platform commission config (`{ enabled, mode, rate_percent }`) | `settings:read` |
| PATCH | `/admin/settings/commission` | Update commission config (partial) | `settings:update` |
| GET | `/admin/settings/commission/category-rates` | List per-category rate overrides | `settings:read` |
| PUT | `/admin/settings/commission/category-rates/:categoryId` | Set a category rate override (`{ rate_percent }`) | `settings:update` |
| DELETE | `/admin/settings/commission/category-rates/:categoryId` | Remove a category rate override (204) | `settings:update` |

> **Commission config (Module 25).** `mode ∈ { flat, category }`. `flat` charges `rate_percent%` platform-wide; `category` charges each order line its category's override rate. A category rate **cascades to sub-categories** — a line's category inherits the nearest ancestor's override when it has none of its own (a child's own override wins), and a category with no ancestor override falls back to `rate_percent`. So setting a rate on a parent category (e.g. "Điện tử") covers products in its child categories too (products are typically assigned to a leaf). `enabled=false` charges no commission and credits no wallet earnings. Defaults `{ enabled: true, mode: flat, rate_percent: 10 }`. `GET/PUT/DELETE …/commission/category-rates` manage the raw (un-cascaded) overrides.

### Admin: Seller Applications — `/api/v1/admin/seller-applications`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/seller-applications` | List applications (paginated, `?status=`) | `seller_applications:read` |
| GET | `/admin/seller-applications/:id` | Get application detail | `seller_applications:read` |
| PATCH | `/admin/seller-applications/:id/approve` | Approve → grant seller role + create active shop | `seller_applications:update` |
| PATCH | `/admin/seller-applications/:id/reject` | Reject (`{ reject_reason? }`) | `seller_applications:update` |

> Only a `pending` application can be reviewed (`SELLER_APP_004`). Approve is idempotent-safe on retry (an existing shop is reused).

### Admin: Withdrawals — `/api/v1/admin/withdrawals`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/withdrawals` | List payout requests (paginated, `?status=`) | `withdrawals:read` |
| PATCH | `/admin/withdrawals/:id/approve` | Approve (funds paid out-of-band; the hold becomes final) | `withdrawals:update` |
| PATCH | `/admin/withdrawals/:id/reject` | Reject (`{ reject_reason? }`) → refund the held amount to the wallet | `withdrawals:update` |

> Only a `pending` withdrawal can be reviewed (`WALLET_003`). Reject refunds the held amount as a `withdrawal_refund` wallet entry.

> **Runtime config via `app_settings`.** `GET` returns `{ enabled, earn_rate_percent, redeem_max_percent, expiry_days }`. `PATCH` accepts any subset of those fields and only writes the keys present (idempotent upsert on `app_settings.key`). `enabled=false` blocks both earning and redemption (`COIN_004` at checkout). Missing keys fall back to defaults (`enabled=true`, `earn_rate_percent=1`, `redeem_max_percent=50`, `expiry_days=90`). Admin-only — these are the only two permissions in the `settings` namespace.

### Admin: AI Chatbox — `/api/v1/admin/ai`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/admin/ai/conversations` | List AI conversations (paginated, newest activity) | `ai_chatbox:read` |
| GET | `/admin/ai/conversations/:id` | Get a conversation with its messages (+ hydrated products) | `ai_chatbox:read` |
| GET | `/admin/ai/settings` | Read AI chatbox settings | `ai_chatbox:read` |
| PATCH | `/admin/ai/settings` | Update settings (`{ chatbox_enabled?, system_prompt? }`) | `ai_chatbox:update` |

> **Admin AI Chatbox (Module 13 × 21).** `ai_chatbox:*` are admin-only permissions (admin holds all). `chatbox_enabled=false` hides the storefront widget (via `GET /ai/config`) and makes `POST /ai/chat` return `CHATBOT_005`. `system_prompt` (nullable) overrides the built-in default prompt; blank/omitted keeps the default. Settings live in the single-row `ai_settings` table.

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
| GET | `/seller/orders/:id/tracking` | Order tracking — status timeline + shipper location (own shop, Module 16) | `orders:read` |
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

### Seller: Flash Sale — `/api/v1/seller/flash-sales`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/seller/flash-sales` | List campaigns currently open for registration | `flash_registrations:read` |
| GET | `/seller/flash-sales/registrations` | List the shop's own registrations (paginated, `?status=`) | `flash_registrations:read` |
| GET | `/seller/flash-sales/:id` | Campaign detail with the shop's own registrations | `flash_registrations:read` |
| POST | `/seller/flash-sales/:id/register` | Register a variant of the shop (`{ product_variant_id, flash_price, flash_quantity }`) | `flash_registrations:create` |
| PATCH | `/seller/flash-sales/items/:itemId` | Edit a **pending** registration (price/quantity, own shop only) | `flash_registrations:update` |
| DELETE | `/seller/flash-sales/items/:itemId` | Withdraw a **pending** registration (own shop only) | `flash_registrations:delete` |

> **Seller-only namespace `flash_registrations:*`** (separate from admin `flash_sales:*` so sellers can't reach `/admin/flash-sales`). Every endpoint resolves the caller's shop (`SHOP_004` if none) and hard-scopes to it. Registration is validated at `POST`: campaign must be open (`FLASH_SALE_009`), the variant must belong to the shop (`FLASH_SALE_010`), and `flash_price` must clear the campaign's `min_discount_percent` (`FLASH_SALE_011`). Only `pending` registrations can be edited/withdrawn (`FLASH_SALE_013`); touching another shop's registration → `FLASH_SALE_008`. Sellers are notified when a registration is approved/rejected.

### Seller: Wallet & Payout — `/api/v1/seller/wallet`, `/api/v1/seller/withdrawals`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/seller/wallet` | My withdrawable balance (`{ balance }`; self-heals an empty wallet) | `wallet:read` |
| GET | `/seller/wallet/transactions` | My wallet ledger (paginated, newest first) | `wallet:read` |
| POST | `/seller/withdrawals` | Request a payout (`{ amount, bank_name, bank_account_number, bank_account_holder }`) — holds the amount immediately | `withdrawals:create` |
| GET | `/seller/withdrawals` | My withdrawal history (paginated) | `wallet:read` |

> **Seller wallet (Module 25).** The wallet is credited with the **net** (items total − platform commission) when an order reaches `completed`. `POST /seller/withdrawals` atomically debits the balance (insufficient → `WALLET_002`) and creates a `pending` request; admin approve finalizes it, reject refunds it. Ledger types: `sale_earning` / `withdrawal` / `reversal` / `withdrawal_refund`.

---

## 9. Shipper Endpoints

All shipper endpoints use **permission-based access control** via `@Permissions()` decorator. Shipper role has `orders:read`, `orders:update`, `dashboard:read` permissions.

### Shipper: Orders — `/api/v1/shipper/orders`

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/shipper/orders` | List orders (filter: `available` or `my_deliveries`) | `orders:read` |
| GET | `/shipper/orders/:id` | Get order detail (available orders + own deliveries) | `orders:read` |
| GET | `/shipper/orders/:id/tracking` | Order tracking — status timeline + shipper location (own deliveries, Module 16) | `orders:read` |
| PATCH | `/shipper/orders/:id/accept` | Accept order — assigns shipper + confirmed → shipping | `orders:update` |
| PATCH | `/shipper/orders/:id/deliver` | Mark delivered — shipping → delivered | `orders:update` |
| PATCH | `/shipper/orders/:id/location` | Update the shipper's current location (`{ latitude, longitude }`) — appends a tracking point (Module 16) | `orders:update` |

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

