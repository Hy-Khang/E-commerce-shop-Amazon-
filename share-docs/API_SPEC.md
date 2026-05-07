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

## 6. Endpoints by Feature

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
| GET | `/categories/:slug` | Get category with products | Public |
| POST | `/categories` | Create category | Admin |
| PATCH | `/categories/:id` | Update category | Admin |
| DELETE | `/categories/:id` | Delete category (if no products) | Admin |
| GET | `/products` | List products (paginated, filtered, sorted) | Public |
| GET | `/products/:slug` | Get product detail (variants + images) | Public |
| POST | `/products` | Create product | Admin |
| PATCH | `/products/:id` | Update product | Admin |
| PATCH | `/products/:id/activate` | Toggle `is_active` | Admin |
| POST | `/products/:id/variants` | Add variant to product | Admin |
| PATCH | `/variants/:id` | Update variant (price, stock, sale_price) | Admin |
| POST | `/products/:id/images` | Add image to product | Admin |
| PATCH | `/images/:id` | Update image sort_order | Admin |
| DELETE | `/images/:id` | Delete image | Admin |

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
| GET | `/orders/:id` | Get order detail + order_items | Customer (own) or Admin |
| PATCH | `/orders/:id/status` | Update order status | Admin |
| PATCH | `/orders/:id/payment-status` | Update payment status | Admin |
| PATCH | `/orders/:id/cancel` | Cancel order (if status = pending) | Customer (own) |
| GET | `/admin/orders` | List all orders (filtered, paginated) | Admin |

### Review — `/api/v1/reviews`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/reviews` | Create review (purchase-verified) | Customer |
| GET | `/products/:productId/reviews` | List reviews for a product | Public |
| GET | `/reviews/me` | List my reviews | Customer |
| DELETE | `/reviews/:id` | Delete own review | Customer (own) or Admin |

---

## 7. Endpoint Details

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
  "address_id": 5
}
```

**Flow:**

```
Read cart → validate stock for each variant → snapshot product_name/sku/price/thumbnail
→ lookup address by address_id → JSON-serialize as shipping_address snapshot
→ calculate total_amount + shipping_fee → create order + order_items
→ clear cart → emit order.created event
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
    "total_amount": 1250000.00,
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

**Errors:** CART_002 (empty cart), ORDER_002 (insufficient stock), AUTH_002 (token expired)

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

## 8. Swagger Integration

- **Library:** `@nestjs/swagger`
- **URL:** `/api/v1/docs` (development only)
- **Tags:** Auth, User Profile, Product Catalog, Cart, Order, Review
- **Decorators:**
  - DTOs: `@ApiProperty()` on every field
  - Controllers: `@ApiTags('Product Catalog')`, `@ApiBearerAuth()`
  - Endpoints: `@ApiOperation()`, `@ApiResponse()`, `@ApiQuery()` for pagination/filter params