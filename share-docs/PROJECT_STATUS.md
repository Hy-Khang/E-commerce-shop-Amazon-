# Project Status — E-Commerce Platform

> **Cập nhật:** 2026-07-23
> **Tổng quan:** 22 modules theo PROJECT_MODULES.md

---

## Bảng tổng hợp

| # | Module | Phase | Backend | Frontend | Tổng | Ghi chú |
|:-:|--------|:-----:|:-------:|:--------:|:----:|---------|
| 1 | Auth & Security | 1 | 100% | 100% | **100%** | Hoàn chỉnh (OAuth, Email Verify, Forgot/Reset/Change/Set Password) |
| 2 | User Profile & Addresses | 1 | 100% | 100% | **100%** | Hoàn chỉnh |
| 3 | Image Upload | 1 | 100% | 100% | **100%** | Hoàn chỉnh (tích hợp trong Product) |
| 4 | Shop Management | 2 | 100% | 100% | **100%** | Hoàn chỉnh |
| 5 | Product Catalog | 2 | 100% | 100% | **100%** | Hoàn chỉnh |
| 6 | Cart & Checkout | 3 | 100% | 100% | **100%** | Hoàn chỉnh |
| 7 | Order Management | 3 | 100% | 100% | **100%** | Hoàn chỉnh (cả auto-complete cron) |
| 8 | Payment Gateway | 3 | 100% | 100% | **100%** | Hoàn chỉnh (VNPay + MoMo sandbox) |
| 9 | Coupons | 3 | 100% | 100% | **100%** | Hoàn chỉnh (cả auto-reversal) |
| 10 | Wishlist & Reviews | 4 | 100% | 100% | **100%** | Hoàn chỉnh |
| 11 | Notifications | 4 | 85% | 100% | **90%** | Polling-based. Chưa có Socket.IO realtime push |
| 12 | Search & Filter | 4 | 20% | 30% | **25%** | Chỉ có LIKE search + category filter. Thiếu visual search, filter sidebar |
| 13 | Admin Panel | 5 | 100% | 100% | **100%** | Hoàn chỉnh (distributed across modules) |
| 14 | Seller Dashboard & Analytics | 5 | 100% | 100% | **100%** | Hoàn chỉnh (Recharts) |
| 15 | Shipper Dashboard | 5 | 5% | 5% | **5%** | Chỉ có role/permission seed + stub pages "Coming Soon" |
| 16 | Order Tracking | 5 | 0% | 0% | **0%** | Chưa làm |
| 17 | Flash Sale | 6 | 0% | 0% | **0%** | Chưa làm |
| 18 | Recently Viewed | 6 | 0% | 0% | **0%** | Chưa làm |
| 19 | Product Comparison | 6 | 0% | 0% | **0%** | Chưa làm — FE-only (Zustand), không cần BE |
| 20 | Chat Realtime | 6 | 0% | 0% | **0%** | Chưa làm — cần Socket.IO |
| 21 | AI Chatbox | 6 | 0% | 0% | **0%** | Chưa làm — cần Grok API |
| 22 | Smart Recommendations | 6 | 0% | 0% | **0%** | Chưa làm |

---

## Thống kê nhanh

| Trạng thái | Số module | Danh sách |
|------------|:---------:|-----------|
| Hoàn chỉnh (100%) | **12** | Auth, User Profile, Image Upload, Shop, Product, Cart, Order, Payment Gateway, Coupons, Wishlist & Reviews, Admin Panel, Seller Dashboard |
| Gần hoàn chỉnh (80-99%) | **1** | Notifications (90%) |
| Đang làm dở / Thiếu nhiều | **2** | Search & Filter (25%), Shipper Dashboard (5%) |
| Chưa làm (0%) | **7** | Order Tracking, Flash Sale, Recently Viewed, Product Comparison, Chat Realtime, AI Chatbox, Smart Recommendations |

**Tổng tiến độ ước tính: ~64% (13/22 modules hoạt động)**

---

## Chi tiết từng module

### Phase 1 — Nền tảng

#### Module 1: Auth & Security — 100% ✅

Hoàn chỉnh. Register / Login / Logout (JWT + Refresh Token hashed, multi-device). Dynamic RBAC đầy đủ (CRUD Roles, Permissions, escalation prevention). OAuth Google/Facebook (passport strategies + FE SocialLoginButtons). Email Verification (OTP 6 chữ số qua email, verify trước khi login). Forgot/Reset Password (gửi token qua email). Change Password (local users) + Set Password (OAuth users). BE: entities, controllers, DTOs, strategies, guards, seed data. FE: Login/Register/VerifyEmail/ForgotPassword/ResetPassword pages, ChangePasswordForm, auth store (Zustand).

#### Module 2: User Profile & Addresses — 100% ✅

Hoàn chỉnh. Profile CRUD + Address CRUD (thêm/sửa/xóa/set default).

#### Module 3: Image Upload — 100% ✅

Hoàn chỉnh. Upload qua multipart/form-data, validate MIME type + size, lưu local filesystem.

---

### Phase 2 — Sản phẩm & Cửa hàng

#### Module 4: Shop Management — 100% ✅

Hoàn chỉnh. Seller tạo shop (1:1), admin duyệt/suspend/ban, public shop profile, 4 migrations.

#### Module 5: Product Catalog — 100% ✅

Hoàn chỉnh. Category tree (self-referencing), Product + Variants (generic option1/option2), Images với sort_order, SEO slug. Admin + Seller CRUD đầy đủ.

---

### Phase 3 — Luồng mua hàng

#### Module 6: Cart & Checkout — 100% ✅

Hoàn chỉnh. Guest cart (session_id), merge cart on login, checkout flow với immutable snapshots.

#### Module 7: Order Management — 100% ✅

Hoàn chỉnh. Full status lifecycle, auto-complete cron (delivered → completed sau 7 ngày), customer/admin/seller endpoints, coupon reversal on cancel.

#### Module 8: Payment Gateway — 100% ✅

Hoàn chỉnh. VNPay (HMAC-SHA512) + MoMo (HMAC-SHA256) sandbox integration. Payment flow: POST /orders → POST /payments/create → redirect to gateway → IPN callback → verify signature → update transaction + order payment_status → redirect to FE result page. Bảng `payment_transactions` với retry support (mỗi order có thể nhiều transactions). Cron timeout 15 phút cho pending transactions. FE: CheckoutPage redirect cho VNPay/MoMo, PaymentResultPage (success/failure + retry), PaymentTransactionList component trên OrderDetailPage + AdminOrderDetailPage. Renamed `banking` → `vnpay` across cả BE + FE. Event-driven: `payment.completed` → OrderPaymentListener marks order paid.

#### Module 9: Coupons — 100% ✅

Hoàn chỉnh. Scope-based (all/categories/products), junction tables, usage tracking, auto-reversal khi cancel order.

---

### Phase 4 — Tương tác & Thông báo

#### Module 10: Wishlist & Reviews — 100% ✅

Hoàn chỉnh. Wishlist CRUD + bulk check. Reviews với purchase verification (3-way link user × product × order). Admin moderation.

#### Module 11: Notifications — 90%

**Đã làm:**
- Event-driven notification creation (`@OnEvent('order.status_updated')`, `@OnEvent('order.placed')`)
- REST API: list notifications (paginated), unread count, mark read, mark all read
- FE: NotificationBell + dropdown + page + store (Zustand) + polling
- Multi-target notifications (notify customer on status change, notify seller on confirm/return)

**Chưa làm:**
- **Socket.IO Gateway** — hiện tại chỉ polling, chưa có WebSocket realtime push
- Theo API_SPEC, polling là design hiện tại. Nhưng PROJECT_MODULES.md yêu cầu Socket.IO

#### Module 12: Search & Filter — 25%

**Đã làm:**
- Basic `LIKE` search trên product name (`?search=keyword`)
- Filter: `category_id`, `min_price`, `max_price`, `is_active`
- Sort: configurable column + order
- FE: Search bar trong Header, CategorySidebar

**Chưa làm:**
- **Full-text search** — không dùng SQL Server `CONTAINS`/`FREETEXT`
- **Visual Search (tìm bằng ảnh)** — không có endpoint `POST /products/search-by-image`, không có Grok API integration
- **Filter sidebar UI** — không có price range slider, rating filter, stock filter, shop filter
- **Search suggestions** — không có auto-suggest/autocomplete
- **Dedicated search module** — logic nằm rải rác trong product module

---

### Phase 5 — Dashboard & Tracking

#### Module 13: Admin Panel — 100% ✅

Hoàn chỉnh. Dashboard stats (7 sections với Promise.allSettled), User/Role/Permission management, distributed admin controllers across features.

#### Module 14: Seller Dashboard & Analytics — 100% ✅

Hoàn chỉnh. Revenue over time, top products, recent orders, low stock alerts — all scoped to seller's shop. FE dùng Recharts.

#### Module 15: Shipper Dashboard — 5%

**Đã làm:**
- Role `shipper` + permissions đã seed (`orders:read`, `orders:update`, `dashboard:read`)
- FE: ShipperLayout + 2 stub pages "Coming Soon"
- Route `/shipper/dashboard`, `/shipper/deliveries`

**Chưa làm:**
- **Backend endpoints** — không có shipper-specific controller/service
- **Danh sách đơn giao** — không có endpoint lấy đơn assigned cho shipper
- **Cập nhật trạng thái giao** — shipper không có dedicated endpoint
- **FE pages** — cả 2 page đều placeholder trống

#### Module 16: Order Tracking — 0% ❌

**Chưa làm gì cả.**
- Không có bảng `order_status_history` (timeline)
- Không có bảng `order_tracking` (GPS/location)
- Không có Leaflet.js/map integration (FE chưa install leaflet)
- Không có timeline component
- Order chỉ có `status` field, không có lịch sử chuyển trạng thái

---

### Phase 6 — Tính năng nâng cao

#### Module 17: Flash Sale — 0% ❌

Chưa làm. Không có entity/controller/service/migration. Không có bảng `flash_sales`, `flash_sale_items`.

#### Module 18: Recently Viewed — 0% ❌

Chưa làm. Không có tracking (cả localStorage FE lẫn DB BE). Không có bảng `recently_viewed`.

#### Module 19: Product Comparison — 0% ❌

Chưa làm. Module này chủ yếu FE (Zustand store + comparison page). Không cần nhiều BE.

#### Module 20: Chat Realtime — 0% ❌

Chưa làm. Không có Socket.IO Gateway, không có bảng `conversations`/`messages`. Package `socket.io` chưa install.

#### Module 21: AI Chatbox — 0% ❌

Chưa làm. Không có Grok API integration, không có chatbox widget, không có endpoint `POST /ai/chat`.

#### Module 22: Smart Recommendations — 0% ❌

Chưa làm. Không có bảng `user_activity_log`, không có scoring service, không có recommendation endpoints.

---

## Bonus: Homepage Module (ngoài 22 modules)

Backend có thêm `src/features/homepage/` với controller/service/repository riêng, cung cấp data cho trang chủ: Special Offers, Best Sellers, Trending, Discover More.

---

## Dependency & Thứ tự ưu tiên hoàn thành

Dựa trên dependency map, thứ tự hoàn thành hợp lý cho các module còn lại:

### Ưu tiên 1 — Hoàn thiện modules gần xong
1. **Search & Filter** — core UX, cần cho mua sắm
2. **Notifications (Socket.IO)** — cần cho Chat Realtime (Module 20)

### Ưu tiên 2 — Phase 5 còn thiếu
3. **Shipper Dashboard** — cần trước Order Tracking
4. **Order Tracking** — phụ thuộc Shipper Dashboard

### Ưu tiên 4 — Phase 6 (độc lập, làm song song được)
7. **Flash Sale** — cần BE + FE
8. **Recently Viewed** — đơn giản, FE localStorage + BE optional
9. **Product Comparison** — chủ yếu FE
10. **Chat Realtime** — cần Socket.IO Gateway (tái sử dụng cho Notifications)
11. **AI Chatbox** — cần Grok API
12. **Smart Recommendations** — cần activity logging + scoring

---

## Packages cần cài thêm

| Package | Cho module | Side |
|---------|-----------|------|
| `socket.io` + `@nestjs/websockets` + `@nestjs/platform-socket.io` | Notifications, Chat | BE |
| `socket.io-client` | Notifications, Chat | FE |
| `leaflet` + `react-leaflet` + `@types/leaflet` | Order Tracking | FE |
| Grok API SDK / HTTP client | AI Chatbox, Visual Search | BE |
| `@nestjs/cache-manager` + `cache-manager-redis-store` | Flash Sale, Recommendations | BE |
