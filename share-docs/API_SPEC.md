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

**Token flow:**

```
Login → { accessToken (15min), refreshToken (7d) }
  → Every request: Authorization: Bearer <accessToken>
  → Token expired: POST /auth/refresh { refreshToken } → new token pair
  → Logout: POST /auth/logout → revoke refresh token (is_revoked = true)
  → Logout all: POST /auth/logout-all → revoke all tokens for user
```

**Auth levels:**

| Level | Description |
|-------|-------------|
| Public | No token needed — `@Public()` decorator |
| Customer | Valid access token with role = `customer` |
| Admin | Valid access token with role = `admin` |
| Customer or Guest | Token or `session_id` header for guest cart |

**Auth errors:**

| Code | Status | Trigger |
|------|--------|---------|
| AUTH_001 | 401 | Invalid credentials (wrong email/password) |
| AUTH_002 | 401 | Access token expired or malformed |
| AUTH_003 | 401 | Refresh token expired or revoked |
| AUTH_004 | 403 | Insufficient role (customer accessing admin route) |
| AUTH_005 | 403 | Account deactivated (`is_active = false`) |

---

## 3. Request Conventions

**Pagination** (all list endpoints):

```
GET /products?page=1&limit=20
```

Defaults: `page=1`, `limit=20`, max `limit=100`.

**Sorting:**

```
GET /products?sort=created_at&order=desc
```

**Filtering by feature:**

| Feature | Params |
|---------|--------|
| Products | `?category_id=5&min_price=100&max_price=500&search=keyword&is_active=true` |
| Orders (admin) | `?status=pending&payment_status=unpaid&user_id=123` |
| Orders (customer) | Filtered by JWT `user_id` automatically |
| Reviews | `?product_id=10&rating=5` |
| Coupons (admin) | `?search=keyword&scope=categories&discount_type=percentage&is_active=true` |

**Validation:** All request bodies validated by `class-validator` DTOs via global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`).

---

## 4. Response Format

**Success (single):**

```json
{ "success": true, "data": { "id": 1, "name": "..." } }
```

**Success (list):**

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

**Success (delete):** `HTTP 204`, no body.

**Error:**

```json
{
  "success": false,
  "error": { "code": "PRODUCT_001", "message": "Product not found or inactive" }
}
```

**Validation error:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_001",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "email must be a valid email address" }]
  }
}
```

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
| COUPON_007 | 409 | Coupon code already exists (admin create duplicate) |
| COUPON_008 | 400 | No items in cart are applicable for this coupon |

### HTTP Status Usage

| Status | Usage |
|--------|-------|
| 200 | GET success, PUT/PATCH success |
| 201 | POST resource created |
| 204 | DELETE success |
| 400 | Bad request, business rule violation |
| 401 | Authentication failure |
| 403 | Authorization failure |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, SKU, slug, review) |
| 422 | Validation failure |
| 500 | Internal server error |

---

## 6. Customer & Public Endpoints

### Auth — `/api/v1/auth`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register new customer account | Public |
| POST | `/auth/login` | Login, returns token pair | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Revoke current refresh token | Customer |
| POST | `/auth/logout-all` | Revoke all refresh tokens | Customer |

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
| GET | `/products/:slug` | Get product detail (variants + images) | Public |

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
| POST | `/orders` | Checkout — create order from cart | Customer |
| GET | `/orders` | List my orders (paginated) | Customer |
| GET | `/orders/:id` | Get order detail + order_items (own only) | Customer |
| PATCH | `/orders/:id/cancel` | Cancel order (if status = pending) | Customer |

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

---

## 7. Admin Endpoints

All admin endpoints require `@Roles('admin')`. Accessing with a customer token returns `AUTH_004 (403)`.

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
| GET | `/admin/orders` | List all orders (paginated) | `?status=pending&payment_status=unpaid&user_id=123&sort=created_at&order=desc` |
| GET | `/admin/orders/:id` | Get order detail + order_items + user info | — |
| PATCH | `/admin/orders/:id/status` | Update order status (valid transitions only) | — |
| PATCH | `/admin/orders/:id/payment-status` | Update payment status (unpaid → paid) | — |

> **Valid status transitions:** `pending → confirmed → shipping → delivered`, `pending → cancelled`, `confirmed → cancelled`, `shipping → cancelled`. Invalid transitions (e.g. `delivered → pending`) return `ORDER_003 (400)`.

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
| GET | `/admin/coupons` | List all coupons (paginated) | `?search=keyword&scope=categories&discount_type=percentage&is_active=true&sort=created_at&order=desc` |
| GET | `/admin/coupons/usages` | List all coupon usages (paginated) | `?coupon_id=5&user_id=123` |
| GET | `/admin/coupons/:id` | Get coupon detail (includes applicable categories/products) | — |
| POST | `/admin/coupons` | Create coupon (code, scope, category_ids/product_ids) | — |
| PATCH | `/admin/coupons/:id` | Update coupon (code is immutable) | — |
| DELETE | `/admin/coupons/:id` | Soft-delete (set `is_active = false`) | — |
| GET | `/admin/coupons/:id/usages` | List usages for a specific coupon (paginated) | — |

> **Scope types:** `all` (entire order), `categories` (specific categories + sub-categories), `products` (specific products). Junction tables `coupon_categories` and `coupon_products` are managed automatically on create/update. Code is stored uppercase and immutable after creation.

### Admin: Dashboard — `/api/v1/admin/dashboard`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/admin/dashboard/stats` | Summary: total users, orders, revenue, products | Admin |

---

## 8. Endpoint Details

### POST `/api/v1/auth/login`

**Request:**

```json
{ "email": "user@example.com", "password": "securePassword123" }
```

**Success (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "dGhpcyBpcyBh...",
    "user": { "id": 1, "email": "user@example.com", "full_name": "Nguyen Van A", "role": "customer" }
  }
}
```

**Errors:** AUTH_001 (invalid credentials), AUTH_005 (account deactivated)

---

### POST `/api/v1/auth/refresh`

**Request:**

```json
{ "refreshToken": "dGhpcyBpcyBh..." }
```

**Success (200):**

```json
{ "success": true, "data": { "accessToken": "eyJhbGciOi...", "refreshToken": "bmV3IHRva2Vu..." } }
```

**Flow:** Hash token → lookup in `refresh_tokens` → check `is_revoked` → check `expires_at` → generate new pair → revoke old token, create new.

**Errors:** AUTH_003 (expired/revoked)

---

### POST `/api/v1/orders` (Checkout)

**Request:**

```json
{
  "payment_method": "cod",
  "address_id": 5,
  "coupon_code": "SUMMER2026"
}
```

> `coupon_code` is optional. If provided, it is validated and applied to the order.

**Flow:**

```
Read cart → validate stock for each variant → snapshot product_name/sku/price/thumbnail
→ lookup address by address_id → JSON-serialize as shipping_address snapshot
→ if coupon_code: validate coupon → calculate scope-aware discount (all/categories/products)
→ total_amount = itemsTotal - discount_amount + shipping_fee
→ Transaction: create order + order_items + record coupon usage + clear cart
→ emit order.created event
```

**Success (201):**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "status": "pending",
    "payment_method": "cod",
    "payment_status": "unpaid",
    "shipping_fee": 30000.00,
    "coupon_code": "SUMMER2026",
    "discount_amount": 100000.00,
    "total_amount": 1150000.00,
    "shipping_address": {
      "full_name": "Nguyen Van A",
      "phone": "0901234567",
      "address_line": "123 Le Loi",
      "city": "Ho Chi Minh"
    },
    "order_items": [
      {
        "product_name": "Áo thun nam basic",
        "sku": "ATN-BLK-L",
        "price": 250000.00,
        "quantity": 2,
        "thumbnail_url": "https://cdn.example.com/img/atn-blk.jpg"
      }
    ],
    "created_at": "2026-05-07T10:30:00.000Z"
  }
}
```

**Errors:** CART_002 (empty cart), ORDER_002 (insufficient stock), AUTH_002 (token expired), COUPON_001-008 (coupon validation errors)

---

### POST `/api/v1/cart/merge`

**Request:**

```json
{ "session_id": "guest_abc123" }
```

**Flow:** Find guest cart by `session_id` → find user cart → merge items (same variant → sum quantities) → delete guest cart.

**Success (200):**

```json
{
  "success": true,
  "data": {
    "id": 10,
    "items": [
      { "id": 1, "product_variant_id": 5, "quantity": 3, "variant": { "sku": "ATN-BLK-L", "price": 250000.00, "color": "Black", "size": "L" } }
    ]
  }
}
```

**Errors:** CART_001 (guest cart not found)

---

### POST `/api/v1/reviews`

**Request:**

```json
{ "product_id": 10, "order_id": 42, "rating": 5, "comment": "Chất lượng tốt, giao hàng nhanh" }
```

**Flow:** Verify order belongs to user → verify order status = `delivered` → verify product exists in order_items → check no duplicate review for same order + product → create review.

**Success (201):**

```json
{
  "success": true,
  "data": {
    "id": 7,
    "product_id": 10,
    "order_id": 42,
    "rating": 5,
    "comment": "Chất lượng tốt, giao hàng nhanh",
    "created_at": "2026-05-07T14:00:00.000Z"
  }
}
```

**Errors:** REVIEW_001 (not purchased), REVIEW_002 (duplicate review), ORDER_004 (order not yours)

---

### POST `/api/v1/coupons/validate`

**Request:**

```json
{ "code": "SUMMER2026" }
```

**Success (200):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "SUMMER2026",
    "discount_type": "percentage",
    "discount_value": 10,
    "max_discount_amount": 100000,
    "min_order_amount": 200000,
    "scope": "categories",
    "applicable_category_ids": [5, 12],
    "applicable_product_ids": null
  }
}
```

**Flow:** Find coupon by code (uppercase) → check `is_active` → check date range → check global usage limit → check per-user usage limit → return discount info with scope details.

**Errors:** COUPON_001 (not found), COUPON_002 (expired), COUPON_003 (limit exceeded), COUPON_004 (user limit), COUPON_006 (inactive)

---

### POST `/api/v1/admin/coupons`

**Request (scope = categories):**

```json
{
  "code": "FASHION20",
  "description": "Giảm 20% cho thời trang",
  "discount_type": "percentage",
  "discount_value": 20,
  "scope": "categories",
  "category_ids": [5, 12],
  "max_discount_amount": 200000,
  "min_order_amount": 300000,
  "max_uses": 500,
  "max_uses_per_user": 1,
  "starts_at": "2026-06-01T00:00:00Z",
  "expires_at": "2026-06-30T23:59:59Z"
}
```

**Request (scope = products):**

```json
{
  "code": "IPHONE50K",
  "discount_type": "fixed",
  "discount_value": 50000,
  "scope": "products",
  "product_ids": [101, 102, 103],
  "starts_at": "2026-06-01T00:00:00Z",
  "expires_at": "2026-06-15T23:59:59Z"
}
```

**Success (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "FASHION20",
    "description": "Giảm 20% cho thời trang",
    "discount_type": "percentage",
    "discount_value": 20,
    "scope": "categories",
    "min_order_amount": 300000,
    "max_discount_amount": 200000,
    "max_uses": 500,
    "max_uses_per_user": 1,
    "current_uses": 0,
    "starts_at": "2026-06-01T00:00:00.000Z",
    "expires_at": "2026-06-30T23:59:59.000Z",
    "is_active": true,
    "category_ids": [5, 12],
    "product_ids": [],
    "created_at": "2026-05-20T10:00:00.000Z"
  }
}
```

**Errors:** COUPON_007 (duplicate code)

---

## 9. Swagger Integration

- **Library:** `@nestjs/swagger`
- **URL:** `/api/v1/docs` (development only)
- **Tags (Customer/Public):** Auth, User Profile, Product Catalog, Cart, Order, Review, Wishlist, Coupon
- **Tags (Admin):** Admin: Users, Admin: Categories, Admin: Products, Admin: Orders, Admin: Reviews, Admin: Wishlist, Admin: Coupons, Admin: Dashboard
- **Decorators:**
  - DTOs: `@ApiProperty()` on every field
  - Controllers: `@ApiTags('Admin: Products')`, `@ApiBearerAuth()`
  - Endpoints: `@ApiOperation()`, `@ApiResponse()`, `@ApiQuery()` for pagination/filter params
  - Admin controllers: separate controller files per feature (e.g. `admin-product.controller.ts`)