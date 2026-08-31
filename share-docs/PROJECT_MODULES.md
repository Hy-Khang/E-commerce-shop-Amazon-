# E-Commerce Platform — Project Modules Documentation

## Thông tin dự án

- **Tên đề tài:** Xây dựng hệ thống thương mại điện tử bán hàng trực tuyến
- **Nhóm:** Ngô Hy Khang (725000187) · Bùi Minh Tuấn (725000686)
- **Kiến trúc:** Feature-based Layered Architecture

## Mục tiêu:
- Xây dựng một sàn thương mại điện tử hoàn chỉnh, phục vụ đồng thời 4 nhóm người dùng: Khách hàng mua sắm, Người bán hàng (Seller), Shipper giao hàng và Quản trị viên (Admin).
- Đảm bảo quy trình mua bán trực tuyến diễn ra liền mạch từ khâu duyệt sản phẩm, thêm giỏ hàng, thanh toán trực tuyến (VNPay, MoMo), theo dõi đơn hàng trên bản đồ cho đến đánh giá sau mua.
- Cung cấp hệ thống quản trị linh hoạt giúp Admin kiểm soát toàn bộ hoạt động trên sàn: quản lý người dùng, cửa hàng, sản phẩm, đơn hàng, mã giảm giá, Flash Sale và theo dõi doanh thu.
- Tích hợp các tính năng nâng cao giúp cải thiện trải nghiệm mua sắm: chat realtime giữa khách hàng và seller, chatbox AI gợi ý sản phẩm thông minh, so sánh sản phẩm và lịch sử sản phẩm đã xem.
- Hỗ trợ đăng nhập đa nền tảng qua OAuth (Google, Facebook) bên cạnh tài khoản nội bộ, kết hợp hệ thống phân quyền động (Dynamic RBAC) kiểm soát chi tiết đến từng API endpoint.
- Áp dụng công nghệ web hiện đại, đảm bảo tốc độ truy cập nhanh, giao diện thân thiện trên mọi thiết bị và bảo mật thông tin người dùng.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite, TypeScript, TanStack Query v5, Zustand, React Hook Form + Zod, Tailwind CSS v4 |
| Frontend — Charts | Recharts (biểu đồ dashboard) |
| Frontend — Maps | Leaflet.js + OpenStreetMap (bản đồ order tracking) |
| Backend | NestJS v11, TypeScript, TypeORM, class-validator + class-transformer |
| Backend — Auth | @nestjs/passport, passport-jwt, passport-google-oauth20, passport-facebook |
| Backend — Scheduler | @nestjs/schedule (cron: auto-complete order, flash sale status) |
| Backend — Events | @nestjs/event-emitter (notification, order events) |
| Backend — Email | @nestjs-modules/mailer + nodemailer (verify email, forgot password) |
| Backend — Docs | @nestjs/swagger (Swagger UI tại `/api/v1/docs`) |
| Database | SQL Server 2022 |
| Auth | JWT + Refresh Token, OAuth 2.0 (Google, Facebook) |
| Payment | VNPay, MoMo (sandbox) |
| Authorization | Dynamic RBAC (Role ↔ Permission → API Endpoint) |
| Realtime | Socket.IO (NestJS Gateway) |
| Backend — Cache | Redis + @nestjs/cache-manager (permission cache, Flash Sale, scoring) |
| AI | Grok |

## Actor

| Actor | Mô tả |
|------|--------|
| **Guest** | Xem sản phẩm, giỏ hàng |
| **Customer** | Mua sắm, giỏ hàng, thanh toán, đánh giá, wishlist |
| **Seller** | Quản lý cửa hàng, sản phẩm, đơn hàng, xem doanh thu |
| **Shipper** | Nhận đơn giao, cập nhật trạng thái giao hàng |
| **Admin** | Toàn quyền quản trị hệ thống, duyệt cửa hàng, phân quyền |

---

## Mục lục Module (23 modules)

| # | Module | Phase | Mô tả ngắn |
|:-:|--------|:-----:|-------------|
| 1 | [Auth & Security](#module-1--auth--security) | 1 | Đăng ký, đăng nhập, JWT, Dynamic RBAC, OAuth (Google/Facebook) |
| 2 | [User Profile & Addresses](#module-2--user-profile--addresses) | 1 | Thông tin cá nhân, sổ địa chỉ |
| 3 | [Image Upload](#module-3--image-upload) | 1 | Upload ảnh sản phẩm qua API |
| 4 | [Shop Management](#module-4--shop-management) | 2 | Quản lý cửa hàng, duyệt shop |
| 5 | [Product Catalog](#module-5--product-catalog) | 2 | Danh mục, sản phẩm, biến thể |
| 6 | [Cart & Checkout](#module-6--cart--checkout) | 3 | Giỏ hàng guest/user, đặt hàng |
| 7 | [Order Management](#module-7--order-management) | 3 | Vòng đời đơn hàng, thanh toán |
| 8 | [Payment Gateway](#module-8--payment-gateway) | 3 | Tích hợp VNPay, MoMo |
| 9 | [Coupons](#module-9--coupons) | 3 | Mã giảm giá, auto-reversal |
| 10 | [Wishlist & Reviews](#module-10--wishlist--reviews) | 4 | Yêu thích, đánh giá sau mua |
| 11 | [Notifications](#module-11--notifications) | 4 | Thông báo realtime qua WebSocket (Socket.IO) |
| 12 | [Search & Filter](#module-12--search--filter) | 4 | Tìm kiếm, lọc, sắp xếp sản phẩm, tìm bằng ảnh |
| 13 | [Admin Panel](#module-13--admin-panel) | 5 | Dashboard admin, quản trị toàn sàn |
| 14 | [Seller Dashboard & Analytics](#module-14--seller-dashboard--analytics) | 5 | Thống kê doanh thu, biểu đồ seller |
| 15 | [Shipper Dashboard](#module-15--shipper-dashboard) | 5 | Quản lý giao hàng |
| 16 | [Order Tracking](#module-16--order-tracking) | 5 | Timeline trạng thái + bản đồ shipper |
| 17 | [Flash Sale](#module-17--flash-sale) | 6 | Deal giảm giá theo khung giờ |
| 18 | [Recently Viewed](#module-18--recently-viewed-sản-phẩm-đã-xem-gần-đây) | 6 | Lịch sử sản phẩm đã xem |
| 19 | [Product Comparison](#module-19--product-comparison-so-sánh-sản-phẩm) | 6 | So sánh sản phẩm side-by-side |
| 20 | [Chat Realtime](#module-20--chat-realtime) | 6 | Nhắn tin Customer ↔ Seller |
| 21 | [AI Chatbox](#module-21--ai-chatbox-gợi-ý-thông-minh) | 6 | Gợi ý sản phẩm bằng AI, FAQ |
| 22 | [Smart Recommendations](#module-22--smart-recommendations-gợi-ý-thông-minh) | 6 | Gợi ý cá nhân hóa dựa trên hành vi người dùng |
| 23 | [Hoàn Xu (Cashback Coins)](#module-23--hoàn-xu-cashback-coins) | 6 | Tích/tiêu Xu hoàn tiền, hết hạn theo lô, cấu hình động |

---

## Permission Matrix

| Hành động | Guest | Customer | Seller | Shipper | Admin |
|-----------|:-----:|:--------:|:------:|:-------:|:-----:|
| **Auth** |
| Register / Login | ✅ | — | — | — | — |
| Login OAuth (Google/FB) | ✅ | — | — | — | — |
| Quên mật khẩu / Đổi mật khẩu | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Profile** |
| Xem/sửa profile mình | — | ✅ | ✅ | ✅ | ✅ |
| CRUD địa chỉ giao hàng | — | ✅ | — | — | — |
| **Shop** |
| Tạo cửa hàng | — | — | ✅ | — | — |
| Sửa cửa hàng mình | — | — | ✅ | — | — |
| Duyệt / suspend / ban shop | — | — | — | — | ✅ |
| Xem shop công khai | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Product** |
| Xem sản phẩm (public) | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRUD sản phẩm shop mình | — | — | ✅ | — | — |
| CRUD danh mục | — | — | — | — | ✅ |
| **Cart** |
| Thao tác giỏ hàng | ✅ (session) | ✅ | — | — | — |
| **Payment** |
| Thanh toán VNPay/MoMo | — | ✅ | — | — | — |
| Xem lịch sử giao dịch | — | ✅ | — | — | ✅ |
| **Order** |
| Tạo đơn (checkout) | — | ✅ | — | — | — |
| Xem đơn hàng mình | — | ✅ | — | — | — |
| Xác nhận đơn (confirm) | — | — | ✅ | — | ✅ |
| Nhận giao & cập nhật trạng thái | — | — | — | ✅ | — |
| Xác nhận nhận hàng | — | ✅ | — | — | — |
| Yêu cầu trả hàng | — | ✅ | — | — | — |
| Hủy đơn | — | ✅ | — | — | ✅ |
| Xem tất cả đơn hàng | — | — | — | — | ✅ |
| **Review** |
| Tạo review (đơn completed) | — | ✅ | — | — | — |
| Xóa review vi phạm | — | — | — | — | ✅ |
| **Coupon** |
| Tạo / sửa / xóa coupon | — | — | — | — | ✅ |
| Apply coupon khi checkout | — | ✅ | — | — | — |
| **Wishlist** |
| Thêm / xóa wishlist | — | ✅ | — | — | — |
| **Notification** |
| Xem notification mình | — | ✅ | ✅ | ✅ | ✅ |
| **Admin Panel** |
| Dashboard thống kê toàn sàn | — | — | — | — | ✅ |
| Quản lý users (ban/unban/role) | — | — | — | — | ✅ |
| CRUD Roles & Permissions | — | — | — | — | ✅ |
| **Seller Dashboard** |
| Dashboard doanh thu shop | — | — | ✅ | — | — |
| **Shipper Dashboard** |
| Danh sách đơn giao | — | — | — | ✅ | — |
| **Flash Sale** |
| Tạo & quản lý chiến dịch (khung giờ) | — | — | — | — | ✅ |
| Duyệt / từ chối đăng ký sản phẩm | — | — | — | — | ✅ |
| Đăng ký sản phẩm vào chiến dịch | — | — | ✅ | — | — |
| Xem / mua sản phẩm Flash Sale | ✅ | ✅ | — | — | — |
| **Chat Realtime** |
| Chat với Seller | — | ✅ | — | — | — |
| Trả lời chat Customer | — | — | ✅ | — | — |
| **AI Chatbox** |
| Sử dụng AI Chatbox | ✅ | ✅ | — | — | — |
| **Smart Recommendations** |
| Xem gợi ý cá nhân hóa | ✅ (session) | ✅ | — | — | — |
| **Hoàn Xu (Cashback)** |
| Tích Xu khi đơn hoàn thành | — | ✅ | — | — | — |
| Dùng Xu khi thanh toán | — | ✅ | — | — | — |
| Xem ví Xu / lịch sử | — | ✅ | — | — | — |
| Cấu hình Xu (rate/cap/expiry/bật-tắt) | — | — | — | — | ✅ |

> **Lưu ý:** Đây là permission mặc định. Dynamic RBAC cho phép Admin tạo custom role với tập permission tùy ý.

---

## Thứ tự triển khai & Dependency Map

Các module được sắp xếp theo thứ tự triển khai — module phía trước là dependency của module phía sau.

```
Phase 1 — Nền tảng (không phụ thuộc module khác)
  ├── Module 1: Auth & Security (bao gồm OAuth Google/Facebook)
  ├── Module 2: User Profile & Addresses
  └── Module 3: Image Upload

Phase 2 — Sản phẩm & Cửa hàng (phụ thuộc Phase 1)
  ├── Module 4: Shop Management         ← Auth
  └── Module 5: Product Catalog          ← Auth, Shop, Image Upload

Phase 3 — Luồng mua hàng (phụ thuộc Phase 2)
  ├── Module 6: Cart & Checkout          ← Product Catalog
  ├── Module 7: Order Management         ← Cart & Checkout
  ├── Module 8: Payment Gateway          ← Order (tích hợp VNPay, MoMo)
  └── Module 9: Coupons                  ← Order (coupon apply lúc checkout)

Phase 4 — Tương tác & Thông báo (phụ thuộc Phase 2-3)
  ├── Module 10: Wishlist & Reviews      ← Product, Order (review cần đơn completed)
  ├── Module 11: Notifications           ← Order (event-driven, tạo Socket.IO Gateway dùng chung)
  └── Module 12: Search & Filter         ← Product Catalog, Grok API (visual search)

Phase 5 — Dashboard & Tracking (phụ thuộc Phase 3)
  ├── Module 13: Admin Panel             ← All modules (thống kê toàn sàn)
  ├── Module 14: Seller Dashboard        ← Shop, Product, Order
  ├── Module 15: Shipper Dashboard       ← Order
  └── Module 16: Order Tracking          ← Order, Shipper Dashboard

Phase 6 — Tính năng nâng cao (phụ thuộc Phase 2-3, triển khai độc lập)
  ├── Module 17: Flash Sale              ← Product Catalog
  ├── Module 18: Recently Viewed         ← Product Catalog
  ├── Module 19: So sánh sản phẩm       ← Product Catalog
  ├── Module 20: Chat Realtime           ← Auth, Shop (tái sử dụng Socket.IO Gateway từ Module 11)
  ├── Module 21: AI Chatbox              ← Product Catalog
  ├── Module 22: Smart Recommendations  ← Product Catalog, AI Chatbox (optional)
  └── Module 23: Hoàn Xu (Cashback)     ← Order (earn on completed, redeem at checkout)
```

---

## Module 1 — Auth & Security

> **Phase 1** · Không phụ thuộc module khác

### Mô tả

Xác thực và phân quyền người dùng trên toàn hệ thống, hỗ trợ đăng nhập qua tài khoản nội bộ và bên thứ 3 (OAuth).

### Chức năng

- Đăng ký (Register) tài khoản mới với **xác thực email** (gửi OTP qua email → verify trước khi kích hoạt)
- Đăng nhập (Login) / Đăng xuất (Logout)
- JWT Access Token + Refresh Token lưu vết (tracked)
- Hỗ trợ duy trì đăng nhập trên nhiều thiết bị
- Thu hồi token khi đăng xuất (token revocation)
- **Quên mật khẩu**: gửi link/OTP reset qua email → đặt mật khẩu mới
- **Đổi mật khẩu**: nhập mật khẩu cũ → xác nhận → đặt mật khẩu mới (trong trang profile)

### OAuth — Đăng nhập bên thứ 3

- Đăng nhập qua **Google** (passport-google-oauth20)
- Đăng nhập qua **Facebook** (passport-facebook)
- Flow: User click "Đăng nhập với Google/FB" → redirect OAuth provider → callback → tìm user bằng email hoặc tạo mới → trả JWT token pair như login thường
- Nếu email đã tồn tại (đăng ký bằng form): **liên kết tài khoản** tự động (thêm `provider` vào user, không tạo duplicate)
- User OAuth không có password — `password_hash = NULL`

### Dynamic RBAC

- Mô hình phân quyền dựa trên ánh xạ **Role → Permission**
- Kiểm soát quyền chi tiết đến từng **API Endpoint**
- Admin quản lý CRUD Role, gán/thu hồi Permission
- Cơ chế chống leo thang quyền (escalation prevention): user không thể tạo role có quyền cao hơn role hiện tại của mình

### Ghi chú kỹ thuật

- Refresh Token được lưu trong DB để hỗ trợ revocation và multi-device tracking
- Access Token ngắn hạn, Refresh Token dài hạn
- Middleware guard kiểm tra Permission trên mỗi request
- Bảng `users` thêm cột `provider` (`local`/`google`/`facebook`) và `provider_id` (ID từ OAuth provider)
- `password_hash` nullable cho user đăng ký qua OAuth
- Sử dụng `@nestjs/passport` với strategies: `passport-google-oauth20`, `passport-facebook`
- Google OAuth: tạo project trên Google Cloud Console (miễn phí)
- Facebook OAuth: tạo app trên Meta for Developers
- Email verify: lưu `email_verified` (BIT) + `email_verify_token` trên bảng `users`
- Forgot password: lưu `password_reset_token` + `password_reset_expires` trên bảng `users`
- Gửi email qua `nodemailer` / `@nestjs-modules/mailer`
- **Redis cache**: cache permission list per role → tránh query `role_permissions` mỗi request, invalidate khi admin thay đổi permission

---

## Module 2 — User Profile & Addresses

> **Phase 1** · Phụ thuộc: Module 1 (Auth)

### Mô tả

Quản lý thông tin cá nhân và sổ địa chỉ giao hàng.

### Chức năng

- Xem và cập nhật thông tin cá nhân (họ tên, số điện thoại)
- Quản lý sổ địa chỉ giao hàng: thêm, sửa, xóa
- Đặt địa chỉ mặc định cho thanh toán

### Ghi chú kỹ thuật

- Mỗi user có nhiều address (1:N)
- Một address được đánh dấu `isDefault = true` dùng cho checkout
- Khi checkout, địa chỉ được snapshot (immutable) vào đơn hàng

---

## Module 3 — Image Upload

> **Phase 1** · Không phụ thuộc module khác

### Mô tả

Upload hình ảnh sản phẩm qua API.

### Chức năng

- Upload hình ảnh sản phẩm qua `multipart/form-data`
- Định dạng hỗ trợ: **JPEG, PNG, WebP**
- Giới hạn dung lượng: **5MB** mỗi file

### Ghi chú kỹ thuật

- Validate file type (MIME type) và file size ở cả FE lẫn BE
- Lưu trữ file trên server hoặc cloud storage (tùy triển khai)
- Trả về URL ảnh sau khi upload thành công

---

## Module 4 — Shop Management

> **Phase 2** · Phụ thuộc: Module 1 (Auth)

### Mô tả

Quản lý cửa hàng của Seller, quy trình duyệt bởi Admin.

### Chức năng

- Seller tạo cửa hàng cá nhân (quan hệ **1:1** — mỗi seller chỉ có 1 shop)
- Quy trình duyệt cửa hàng mới: `pending_verification → active`
- Admin quản lý trạng thái cửa hàng: `active`, `suspended`, `banned`
- Sản phẩm từ shop không hoạt động (suspended/banned) bị ẩn khỏi trang mua sắm
- Trang hồ sơ cửa hàng công khai: thông tin shop, thống kê, danh sách sản phẩm

### Trạng thái cửa hàng

```
pending_verification → active → suspended → active (reactivate)
                         ↓
                       banned
```

---

## Module 5 — Product Catalog

> **Phase 2** · Phụ thuộc: Module 1 (Auth), Module 3 (Image Upload), Module 4 (Shop)

### Mô tả

Quản lý danh mục sản phẩm đa cấp và sản phẩm với biến thể linh hoạt.

### Chức năng — Category

- Danh mục sản phẩm đa cấp (cấu trúc cây phân nhánh vô hạn)
- Quan hệ **self-referencing** (`parentId` → cùng bảng `Category`)
- Auto-generate **SEO slug** duy nhất cho danh mục

### Chức năng — Product & Variants

- CRUD sản phẩm thuộc cửa hàng của Seller
- Biến thể sản phẩm linh hoạt (Product Variants) dựa trên **2 thuộc tính tùy chọn** (ví dụ: Kích thước + Màu sắc, Dung lượng + Màu, v.v.) — không cố định trường dữ liệu
- Mỗi variant có: giá riêng, tồn kho riêng, SKU riêng
- Quản lý hình ảnh sản phẩm với thứ tự hiển thị tùy biến (`displayOrder`)
- Auto-generate **SEO slug** duy nhất cho sản phẩm

### Ghi chú kỹ thuật

- Thiết kế variant dạng: `Product → ProductVariant(optionName1, optionValue1, optionName2, optionValue2, price, stock, sku)`
- Category tree có thể query bằng recursive CTE hoặc materialized path
- Image ordering qua trường `displayOrder` (integer, sortable)

---

## Module 6 — Cart & Checkout

> **Phase 3** · Phụ thuộc: Module 2 (Addresses), Module 5 (Product Catalog)

### Mô tả

Giỏ hàng hỗ trợ cả guest và authenticated user, quy trình đặt hàng.

### Chức năng — Cart

- **Guest Cart**: khách vãng lai sử dụng Session ID để lưu giỏ hàng
- **Merge Cart**: tự động đồng bộ/gộp giỏ hàng khi khách đăng nhập (guest cart → user cart)
- Thêm, sửa số lượng, xóa sản phẩm khỏi giỏ hàng
- Cart item liên kết đến **ProductVariant** cụ thể

### Chức năng — Checkout

- Tính toán giá trị đơn hàng + phí vận chuyển
- Áp dụng mã giảm giá (coupon)
- Chọn địa chỉ giao hàng + phương thức thanh toán
- Tạo đơn hàng (Order) từ Cart

### Immutable Snapshot

Khi đặt hàng, hệ thống **lưu cứng** (snapshot) các thông tin sau vào bảng Order/OrderItem để tránh sai lệch dữ liệu lịch sử:

- Thông tin sản phẩm (tên, ảnh, thuộc tính variant)
- Đơn giá tại thời điểm mua
- Địa chỉ giao hàng tại thời điểm mua

---

## Module 7 — Order Management

> **Phase 3** · Phụ thuộc: Module 6 (Cart & Checkout)

### Mô tả

Quản lý toàn bộ vòng đời đơn hàng cho cả 4 roles.

### Trạng thái đơn hàng

```
pending → confirmed → shipping → delivered → completed
                                     ↓
                               return_requested
   ↓ (bất kỳ lúc nào trước shipping)
 cancelled
```

| Trạng thái | Mô tả | Ai thực hiện |
|------------|--------|-------------|
| `pending` | Đơn hàng vừa tạo, chờ xác nhận | System |
| `confirmed` | Seller/Admin xác nhận đơn | Seller / Admin |
| `shipping` | Shipper nhận giao | Shipper |
| `delivered` | Shipper đã giao thành công | Shipper |
| `completed` | Khách hàng xác nhận nhận hàng | Customer / Auto |
| `return_requested` | Khách yêu cầu trả hàng/hoàn tiền | Customer |
| `cancelled` | Đơn bị hủy | Customer / Admin |

### Phương thức thanh toán

- **COD** (Cash on Delivery)
- **VNPay** (Chuyển khoản ngân hàng, QR code) — xem Module 8
- **MoMo** (Ví điện tử, QR code) — xem Module 8

### Auto-complete

- Cron job tự động chuyển `delivered → completed` sau **7 ngày** kể từ khi giao hàng thành công
- Mục đích: tránh trường hợp khách không bấm xác nhận

### Ghi chú kỹ thuật

- Khi đơn bị `cancelled`: hoàn lại stock, hoàn lại coupon usage (nếu có)
- Notification được trigger mỗi khi trạng thái thay đổi

---

## Module 8 — Payment Gateway

> **Phase 3** · Phụ thuộc: Module 7 (Order Management)

### Mô tả

Tích hợp cổng thanh toán trực tuyến VNPay và MoMo, cho phép khách hàng thanh toán đơn hàng qua chuyển khoản, QR code hoặc ví điện tử.

### Chức năng

- Thanh toán qua **VNPay** (chuyển khoản ngân hàng, QR code)
- Thanh toán qua **MoMo** (ví điện tử, QR code)
- **Redirect flow**: tạo order → redirect sang trang thanh toán gateway → user thanh toán → callback về app → cập nhật `payment_status`
- Hiển thị **trạng thái thanh toán** realtime trên trang xác nhận đơn hàng
- Hỗ trợ **hoàn tiền** (refund) khi đơn hàng bị hủy (tùy gateway)
- Giữ nguyên **COD** (thanh toán khi nhận hàng) như phương thức mặc định

### Flow thanh toán

```
Customer chọn VNPay/MoMo → Backend tạo payment URL
  → Redirect sang trang thanh toán gateway
  → User thanh toán thành công/thất bại
  → Gateway gọi callback (IPN/webhook) về backend
  → Backend verify chữ ký + cập nhật payment_status
  → Redirect user về trang kết quả đơn hàng
```

### Trạng thái giao dịch

| Trạng thái | Mô tả |
|------------|--------|
| `pending` | Đang chờ thanh toán (redirect sang gateway) |
| `completed` | Thanh toán thành công (IPN xác nhận) |
| `failed` | Thanh toán thất bại hoặc hết hạn |
| `refunded` | Đã hoàn tiền |

### Ghi chú kỹ thuật

- Bảng `payment_transactions` lưu lịch sử giao dịch: transaction_id từ gateway, amount, status, response data
- VNPay sandbox: dùng URL test + merchant credentials miễn phí cho development
- MoMo sandbox: dùng test credentials từ MoMo Business
- **IPN (Instant Payment Notification)**: endpoint nhận callback từ gateway, verify HMAC signature trước khi cập nhật
- Timeout: nếu user không thanh toán trong 15 phút → transaction tự động `failed`
- Cột `payment_method` trong `orders` thêm giá trị `vnpay`
- Mỗi order có thể có nhiều `payment_transactions` (retry khi fail)
- Idempotency: kiểm tra `transaction_ref` trùng lặp để tránh xử lý IPN nhiều lần

---

## Module 9 — Coupons

> **Phase 3** · Phụ thuộc: Module 5 (Product Catalog), Module 7 (Order — coupon usage gắn với order)

### Mô tả

Hệ thống mã giảm giá linh hoạt cho toàn sàn.

### Chức năng

- Tạo mã giảm giá với nhiều **phạm vi áp dụng**:
  - Toàn sàn (platform-wide)
  - Theo danh mục sản phẩm (category-specific)
  - Theo sản phẩm cụ thể (product-specific)
- Ràng buộc điều kiện sử dụng:
  - Giá trị đơn hàng tối thiểu (`minOrderValue`)
  - Mức giảm tối đa (`maxDiscountAmount`)
  - Số lượt sử dụng tối đa toàn hệ thống (`maxUsageTotal`)
  - Số lượt sử dụng tối đa mỗi người dùng (`maxUsagePerUser`)
- Lịch sử sử dụng mã giảm giá (coupon usage history)
- **Auto-reversal**: tự động hoàn lại coupon usage khi đơn hàng bị hủy, không mất tính toàn vẹn lịch sử

### Ghi chú kỹ thuật

- Reversal tạo record mới (type = `reversal`) thay vì xóa record cũ → giữ audit trail
- Kiểm tra điều kiện coupon tại thời điểm checkout (validate trước khi apply)
- Coupon có thời hạn (`startDate`, `endDate`)

---

## Module 10 — Wishlist & Reviews

> **Phase 4** · Phụ thuộc: Module 5 (Product), Module 7 (Order — review cần đơn completed)

### Mô tả

Chức năng tương tác: yêu thích sản phẩm và đánh giá sau mua.

### Chức năng — Wishlist

- Thêm / xóa sản phẩm yêu thích
- Xem danh sách sản phẩm đã thích

### Chức năng — Reviews

- Đánh giá sản phẩm (rating + nội dung text)
- **Xác thực mua hàng**: chỉ cho phép đánh giá sản phẩm thuộc đơn hàng đã `completed`
- Admin kiểm duyệt và xóa đánh giá vi phạm (moderation)

### Ghi chú kỹ thuật

- Review gắn với `OrderItem` để verify purchase
- Mỗi user chỉ review 1 lần / sản phẩm / đơn hàng (hoặc tùy business rule)

---

## Module 11 — Notifications

> **Phase 4** · Phụ thuộc: Module 7 (Order — event-driven theo order status change)

### Mô tả

Hệ thống thông báo realtime qua WebSocket, đẩy thông báo tức thì đến người dùng.

### Chức năng

- Thông báo **event-driven** khi trạng thái đơn hàng thay đổi:
  - Admin/Seller thay đổi trạng thái → thông báo cho Customer
  - Customer xác nhận nhận hàng / yêu cầu trả hàng → thông báo cho Seller
- **Realtime delivery** qua Socket.IO — thông báo đẩy tức thì, không cần polling
- Cập nhật **badge số thông báo chưa đọc** realtime trên header
- Đánh dấu đã đọc từng thông báo hoặc tất cả (mark as read / mark all as read)
- **Fallback REST API** — `GET /notifications/unread-count` cho trường hợp WebSocket chưa kết nối (lần đầu load trang)

### Ghi chú kỹ thuật

- Tạo **Socket.IO Gateway** dùng chung — Module 20 (Chat Realtime) sẽ tái sử dụng cùng gateway, không tạo connection riêng
- Backend tạo notification record trong DB → emit event `new_notification` qua Socket.IO đến user đang online
- Socket event: `new_notification` (server → client) chứa `{ id, type, title, message, data, created_at }`
- Socket event: `notification_read` (client → server) để đánh dấu đã đọc
- Nếu user offline → notification lưu DB → hiển thị khi user mở lại app (query REST API)
- REST API vẫn giữ nguyên cho: danh sách notifications (paginated), mark all as read
- **Redis cache**: cache unread count per user → giảm query DB cho badge hiển thị

---

## Module 12 — Search & Filter

> **Phase 4** · Phụ thuộc: Module 5 (Product Catalog), Module 21 (AI — Grok API cho visual search)

### Mô tả

Tìm kiếm và lọc sản phẩm — tính năng cốt lõi giúp khách hàng khám phá sản phẩm trên sàn.

### Chức năng — Search

- Tìm kiếm sản phẩm theo từ khóa (tên sản phẩm, mô tả)
- Full-text search sử dụng `LIKE` / `CONTAINS` trên SQL Server
- Gợi ý tìm kiếm (search suggestions) dựa trên tên sản phẩm và danh mục

### Chức năng — Tìm kiếm bằng ảnh (Visual Search)

- User **upload ảnh** hoặc **chụp từ camera** trên web
- Backend gửi ảnh đến **Grok API** (multimodal — tái sử dụng từ Module 21) để phân tích
- AI trích xuất thuộc tính sản phẩm: **loại sản phẩm, màu sắc, chất liệu, phong cách...**
- Dùng kết quả phân tích để query sản phẩm trên DB → trả về danh sách sản phẩm tương tự
- Hiển thị tag AI đã nhận diện (ví dụ: "Áo thun · Đen · Nam") để user tinh chỉnh kết quả

### Chức năng — Filter

- Lọc theo **danh mục** (category) — hỗ trợ danh mục đa cấp (chọn parent → hiển thị sản phẩm của tất cả sub-categories)
- Lọc theo **khoảng giá** (`min_price`, `max_price`)
- Lọc theo **đánh giá trung bình** (`min_rating`) — ví dụ: từ 4 sao trở lên
- Lọc theo **tình trạng kho** — còn hàng / hết hàng
- Lọc theo **cửa hàng** (shop)
- Kết hợp nhiều bộ lọc cùng lúc (AND logic)

### Chức năng — Sort

- Sắp xếp theo **giá** (thấp → cao, cao → thấp)
- Sắp xếp theo **mới nhất** (`created_at DESC`)
- Sắp xếp theo **bán chạy** (tổng số lượng đã bán)
- Sắp xếp theo **đánh giá** (rating trung bình)

### Ghi chú kỹ thuật

- Query sử dụng index trên `products.name`, `products.category_id`, `product_variants.price`
- Phân trang kết quả tìm kiếm (paginated) với `page` + `limit`
- Filter giá dựa trên `MIN(product_variants.price)` của mỗi sản phẩm (giá thấp nhất trong các variant)
- Kết quả chỉ hiển thị sản phẩm `is_active = true` và thuộc shop `status = 'active'`
- **Visual Search**: gọi Grok API (multimodal) với ảnh upload → nhận JSON mô tả `{ category, color, material, style }` → build dynamic WHERE query
- API endpoint: `POST /api/v1/products/search-by-image` (multipart/form-data) — Public
- Rate limiting visual search: tối đa **10 request/phút/user** (tốn API cost)

---

## Module 13 — Admin Panel

> **Phase 5** · Phụ thuộc: Tất cả module Phase 1–4 (thống kê toàn sàn)

### Mô tả

Bảng điều khiển quản trị cho Admin.

### Dashboard & Thống kê

- Tổng doanh thu
- Xu hướng doanh thu theo thời gian (biểu đồ)
- Phân bố đơn hàng theo trạng thái
- Sản phẩm bán chạy (top selling)
- Cảnh báo tồn kho thấp (low stock alerts)

### Quản lý người dùng

- Xem danh sách tất cả users
- Khóa / mở khóa tài khoản (ban / unban)
- Thay đổi vai trò (role) của user

### Quản lý Roles & Permissions

- CRUD vai trò (Role)
- Gán / thu hồi quyền (Permission) cho Role
- Cơ chế chống leo thang quyền (escalation prevention)

### Quản lý cửa hàng

- Duyệt cửa hàng mới (`pending_verification → active`)
- Tạm ngưng (suspend) / Cấm (ban) cửa hàng

### Kiểm duyệt đánh giá

- Xem danh sách đánh giá
- Xóa đánh giá vi phạm (moderation)

### Quản lý AI Chatbox

- **Bật / tắt** chatbox trên storefront (toggle trong admin settings)
- **Xem lịch sử hội thoại AI** — danh sách conversations giữa khách hàng và chatbot, phục vụ giám sát chất lượng phản hồi

---

## Module 14 — Seller Dashboard & Analytics

> **Phase 5** · Phụ thuộc: Module 4 (Shop), Module 5 (Product), Module 7 (Order)

### Mô tả

Bảng điều khiển toàn diện dành cho Seller — theo dõi hoạt động cửa hàng và phân tích hiệu quả kinh doanh.

### Chức năng — Tổng quan

- **Doanh thu hôm nay / tuần / tháng** với so sánh % tăng trưởng so với kỳ trước
- **Số đơn hàng** theo trạng thái: chờ xác nhận, đang giao, hoàn thành, đã hủy
- **Tỷ lệ hủy đơn** (cancellation rate) — cảnh báo nếu vượt ngưỡng
- Quản lý đơn hàng (xác nhận, xem chi tiết)

### Chức năng — Biểu đồ

- Biểu đồ **doanh thu theo thời gian** (7 ngày / 30 ngày / 12 tháng)
- Biểu đồ **đơn hàng theo trạng thái** (pie/donut chart)
- Biểu đồ **top 5 sản phẩm bán chạy** (bar chart)

### Chức năng — Sản phẩm & Kho

- Danh sách **top sản phẩm bán chạy** với số lượng đã bán + doanh thu
- Cảnh báo **sản phẩm sắp hết hàng** (stock ≤ ngưỡng tùy chỉnh)
- **Đánh giá trung bình** của shop + số lượt đánh giá gần đây

### Ghi chú kỹ thuật

- API endpoint: `GET /api/v1/seller/dashboard` — trả về tất cả thống kê trong 1 request
- Query doanh thu chỉ tính đơn `completed` thuộc shop của seller (`order_items.shop_id`)
- Filter theo khoảng thời gian: `?period=7d|30d|12m`
- Sử dụng `Promise.allSettled()` tương tự Admin Dashboard — partial failure tolerance

---

## Module 15 — Shipper Dashboard

> **Phase 5** · Phụ thuộc: Module 7 (Order)

### Mô tả

Bảng điều khiển dành cho Shipper quản lý giao hàng.

### Chức năng

- Xem danh sách đơn hàng được phân phối
- Cập nhật trạng thái đơn hàng (`confirmed → shipping → delivered`)

---

## Module 16 — Order Tracking

> **Phase 5** · Phụ thuộc: Module 7 (Order), Module 15 (Shipper Dashboard)

### Mô tả

Theo dõi đơn hàng trực quan: timeline trạng thái + bản đồ vị trí shipper, giúp khách hàng nắm được tiến độ giao hàng.

### Chức năng — Timeline

- Hiển thị **timeline trạng thái** đơn hàng với timestamp từng bước:
  ```
  ✅ Đơn hàng đã tạo          — 10/07 14:30
  ✅ Seller xác nhận           — 10/07 15:00
  ✅ Đang giao hàng            — 11/07 09:00
  ⏳ Đã giao thành công        — Chờ...
  ○  Hoàn thành
  ```
- Mỗi lần chuyển trạng thái lưu `timestamp` vào bảng `order_status_history`
- Hiển thị trên trang chi tiết đơn hàng của Customer

### Chức năng — Bản đồ vị trí Shipper

- Shipper **cập nhật vị trí thủ công** trên web: click chọn điểm trên bản đồ hoặc nhập địa chỉ
- Customer xem bản đồ với **2 markers**:
  - Vị trí shipper (lần cập nhật gần nhất)
  - Địa chỉ giao hàng
- Chỉ hiển thị bản đồ khi đơn ở trạng thái `shipping`

### Ghi chú kỹ thuật

- Sử dụng **Leaflet.js + OpenStreetMap** (miễn phí, không cần API key)
- Bảng `order_status_history` (id, order_id, status, note, created_at) — lưu mỗi lần chuyển trạng thái
- Bảng `order_tracking` (id, order_id, latitude, longitude, updated_at) — lưu vị trí shipper cập nhật
- API: `PATCH /api/v1/shipper/orders/:id/location` — shipper cập nhật tọa độ
- API: `GET /api/v1/orders/:id/tracking` — customer xem timeline + vị trí shipper
- Không cần GPS realtime — shipper cập nhật thủ công, phù hợp demo trên web

---

## Module 17 — Flash Sale

> **Phase 6** · Phụ thuộc: Module 5 (Product Catalog) · *Triển khai độc lập*

### Mô tả

Chương trình giảm giá theo khung giờ, tạo hiệu ứng FOMO thúc đẩy mua sắm — tính năng đặc trưng của các sàn e-commerce lớn.

### Chức năng — mô hình Đăng ký + Duyệt (Shopee-style)

- Admin tạo **chiến dịch Flash Sale** trống với **cửa sổ đăng ký** (`registration_starts_at`/`registration_ends_at`), **khung giờ diễn ra** (`starts_at`/`ends_at`) và **% giảm tối thiểu** (`min_discount_percent`)
- **Seller đăng ký** sản phẩm của shop mình vào chiến dịch (giá sale riêng + số lượng giới hạn), chỉ trong cửa sổ đăng ký và phải đạt sàn giảm giá
- **Admin duyệt / từ chối** từng đăng ký (kèm lý do). Admin **không** tự thêm sản phẩm
- Chỉ đăng ký **đã duyệt (`approved`)** mới lên giá & hiển thị trên storefront
- Hiển thị **countdown timer** + **progress bar** "Đã bán X%"
- Trang Flash Sale riêng + banner trang chủ khi có chiến dịch active

### Trạng thái chiến dịch & đăng ký

```
Campaign:   scheduled → active → ended
Đăng ký:    pending → approved | rejected   (approved → rejected: admin thu hồi)
```

| Campaign | Mô tả |
|------------|--------|
| `scheduled` | Chưa đến giờ diễn ra; đang/đã mở cửa sổ đăng ký |
| `active` | Đang diễn ra, khách có thể mua (chỉ item `approved`) |
| `ended` | Hết giờ hoặc hết hàng |

### Ghi chú kỹ thuật

- Bảng `flash_sales` (thêm `registration_starts_at`, `registration_ends_at`, `min_discount_percent`) + `flash_sale_items` (thêm `shop_id`, `status`, `created_by`, `reviewed_by`, `reviewed_at`, `reject_reason`). Một "đăng ký" = một `flash_sale_item` — không có bảng riêng, giữ nguyên `order_items.flash_sale_item_id` / consume / reverse / coupon stacking
- Permission tách namespace: admin dùng `flash_sales:*` (quản lý + duyệt), seller dùng `flash_registrations:*` (đăng ký)
- Filtered UNIQUE `(flash_sale_id, product_variant_id) WHERE status <> 'rejected'` → cho phép đăng ký lại sau khi bị từ chối, giữ row rejected làm audit
- `FlashSaleService.getActiveFlashPriceMap` lọc thêm `status='approved'` → nguồn chân lý giá cho checkout/preview/coupon; `consume` chống oversell + yêu cầu `approved` + campaign còn live
- Cron chuyển trạng thái campaign `scheduled → active → ended`; item duyệt lúc campaign `active` lên giá ngay
- Event `flash_sale.registration_reviewed` → `NotificationListener` báo seller khi được duyệt/từ chối
- **Redis cache** (dự kiến): cache Flash Sale data trong khung giờ cao điểm

---

## Module 18 — Recently Viewed (Sản phẩm đã xem gần đây)

> **Phase 6** · Phụ thuộc: Module 5 (Product Catalog) · *Triển khai độc lập*

### Mô tả

Lưu và hiển thị lịch sử sản phẩm mà khách hàng đã xem, giúp quay lại nhanh chóng.

### Chức năng

- Tự động ghi nhận khi khách xem chi tiết sản phẩm
- Hiển thị carousel **"Sản phẩm bạn đã xem gần đây"** tại:
  - Trang chủ
  - Trang chi tiết sản phẩm (phía dưới)
  - Trang giỏ hàng
- Giới hạn hiển thị **20 sản phẩm gần nhất**, tự động loại bỏ cũ nhất
- Hỗ trợ cả **Guest** (localStorage) và **Customer** (lưu DB)

### Ghi chú kỹ thuật

- Guest: lưu danh sách `{ product_id, viewed_at }` vào `localStorage` (Zustand persist); carousel hydrate dữ liệu tươi qua `GET /api/v1/products?ids=1,2,3`
- Customer: lưu vào bảng `recently_viewed` (user_id, product_id, viewed_at) — UPSERT khi xem lại sản phẩm đã có (bump `viewed_at`), giữ tối đa 20 mới nhất
- API endpoints (Customer): `GET /api/v1/recently-viewed` (danh sách), `POST /api/v1/recently-viewed` (ghi nhận view), `POST /api/v1/recently-viewed/merge` (merge)
- Response cùng shape với `GET /products` (Product + variants/images) → guest & customer render chung `ProductCard`; lọc visibility (is_active + shop active)
- Merge localStorage → DB khi đăng nhập (tương tự cart merge — gọi ở useLogin/useVerifyEmail/OAuthCallback)

---

## Module 19 — Product Comparison (So sánh sản phẩm)

> **Phase 6** · Phụ thuộc: Module 5 (Product Catalog) · *Triển khai độc lập*

### Mô tả

Cho phép khách hàng chọn nhiều sản phẩm cùng danh mục để so sánh trực quan side-by-side.

### Chức năng

- Nút **"So sánh"** trên mỗi product card trong danh sách sản phẩm
- Chọn tối đa **4 sản phẩm** cùng danh mục để so sánh
- **Thanh so sánh (comparison bar)** floating ở dưới màn hình — hiển thị số sản phẩm đã chọn
- Trang so sánh hiển thị bảng **side-by-side**:
  - Hình ảnh + tên sản phẩm
  - Khoảng giá (min-max từ variants)
  - Đánh giá trung bình + số lượt đánh giá
  - Danh mục
  - Cửa hàng
  - Các variant có sẵn (màu sắc, kích thước, ...)
  - Tình trạng còn hàng
- Highlight **điểm khác biệt** giữa các sản phẩm
- Nút "Thêm vào giỏ hàng" trực tiếp từ bảng so sánh

### Ghi chú kỹ thuật

- Danh sách so sánh lưu ở **frontend state** (Zustand store) — không cần lưu DB
- Chỉ cho phép so sánh sản phẩm cùng `category_id` (hoặc cùng parent category)
- API: sử dụng endpoint `GET /api/v1/products?ids=1,2,3,4` — query nhiều sản phẩm cùng lúc
- Responsive: trên mobile hiển thị dạng swipe/carousel thay vì bảng ngang

---

## Module 20 — Chat Realtime

> **Phase 6** · Phụ thuộc: Module 1 (Auth), Module 4 (Shop) · *Triển khai độc lập*

### Mô tả

Hệ thống nhắn tin trực tiếp giữa Customer và Seller, giúp trao đổi nhanh về sản phẩm, đơn hàng trước và sau khi mua.

### Chức năng

- Nhắn tin **realtime** giữa Customer ↔ Seller qua WebSocket (Socket.IO)
- Danh sách cuộc hội thoại (conversation list) với tin nhắn mới nhất và thời gian
- Hiển thị **badge số tin nhắn chưa đọc** trên header
- Đánh dấu đã đọc khi mở cuộc hội thoại
- Customer có thể bắt đầu chat từ trang sản phẩm hoặc trang shop (nút "Chat với shop")
- Hỗ trợ gửi tin nhắn **text** (có thể mở rộng hình ảnh sau)

### Trạng thái tin nhắn

```
sent → delivered → read
```

### Ghi chú kỹ thuật

- Tái sử dụng **Socket.IO Gateway** đã tạo ở Module 11 (Notifications) — cùng connection, thêm chat events
- Xác thực WebSocket qua JWT token trong handshake
- Lưu trữ tin nhắn vào database (bảng `conversations` + `messages`) để hỗ trợ lịch sử chat
- Khi user offline, tin nhắn được lưu DB → hiển thị khi user online lại
- Mỗi conversation gắn với 1 Customer + 1 Shop (không phải group chat)

---

## Module 21 — AI Chatbox (Gợi ý thông minh)

> **Phase 6** · Phụ thuộc: Module 5 (Product Catalog) · *Triển khai độc lập*

### Mô tả

Chatbox AI tích hợp trên sàn, hỗ trợ khách hàng tìm kiếm sản phẩm, trả lời câu hỏi thường gặp và gợi ý sản phẩm phù hợp.

### Chức năng

- **Gợi ý sản phẩm** dựa trên mô tả nhu cầu của khách hàng bằng ngôn ngữ tự nhiên
  - Ví dụ: "Tôi cần áo thun nam size L màu đen giá dưới 300k" → trả về danh sách sản phẩm phù hợp
- **Trả lời FAQ** về chính sách: đổi trả, vận chuyển, thanh toán, mã giảm giá
- **Tóm tắt thông tin sản phẩm** — hỏi chatbox để so sánh hoặc tìm hiểu nhanh về sản phẩm
- Widget chatbox **floating** ở góc phải dưới màn hình, mở rộng/thu gọn được
- Lưu **lịch sử hội thoại** trong phiên làm việc

### Ghi chú kỹ thuật

- Backend gọi **Grok API** để xử lý ngôn ngữ tự nhiên
- Sử dụng **RAG (Retrieval-Augmented Generation)**: query sản phẩm từ DB → đưa vào context cho AI trả lời chính xác
- System prompt được cấu hình sẵn với thông tin về sàn, chính sách, hướng dẫn trả lời
- API endpoint: `POST /api/v1/ai/chat` — nhận `message` + `conversation_history`, trả về response của AI
- Rate limiting: giới hạn số request/phút để kiểm soát chi phí API (**Redis store** cho `@nestjs/throttler`)
- Fallback: nếu AI service không khả dụng → hiển thị thông báo và gợi ý liên hệ trực tiếp với seller

---

## Module 22 — Smart Recommendations (Gợi ý thông minh)

> **Phase 6** · Phụ thuộc: Module 5 (Product Catalog), Module 21 (AI Chatbox — optional) · *Triển khai độc lập*

### Mô tả

Hệ thống gợi ý sản phẩm cá nhân hóa dựa trên hành vi người dùng (content-based filtering), kết hợp AI để diễn giải gợi ý tự nhiên.

### Chức năng — Activity Log (Thu thập hành vi)

- Ghi nhận tự động các hành động của user trên sàn:
  - `VIEW_PRODUCT` — xem chi tiết sản phẩm
  - `VIEW_CATEGORY` — duyệt danh mục
  - `SEARCH` — tìm kiếm từ khóa
  - `ADD_TO_CART` — thêm vào giỏ hàng
  - `ADD_TO_WISHLIST` — thêm vào yêu thích
  - `PURCHASE` — mua hàng thành công
- Hỗ trợ cả **Guest** (session_id) và **Customer** (user_id)
- Cleanup cron: xóa log cũ hơn **90 ngày** để kiểm soát dung lượng

### Chức năng — Content-Based Scoring

- Xây dựng **user profile vector** từ activity log:
  - Category ưa thích (tần suất xem + mua)
  - Khoảng giá thường mua (price range)
  - Thuộc tính sản phẩm hay chọn (color, size, brand...)
- Tính **điểm tương đồng** giữa sản phẩm và user profile:
  - Cùng category → +3 điểm
  - Giá nằm trong khoảng thường mua → +2 điểm
  - Thuộc cùng shop đã mua → +1 điểm
  - Đã mua rồi → loại bỏ (không gợi ý lại)
- Sắp xếp sản phẩm theo điểm → trả về top N gợi ý

### Chức năng — Hiển thị gợi ý

- **"Gợi ý cho bạn"** — carousel trên trang chủ (dựa trên toàn bộ hành vi)
- **"Sản phẩm tương tự"** — trên trang chi tiết sản phẩm (dựa trên SP đang xem)
- **"Mua kèm"** — sản phẩm thường được mua cùng (dựa trên order_items chung)
- **AI diễn giải** (optional): "Vì bạn hay xem áo thun nam, chúng tôi gợi ý..." — tích hợp Module 21

### Ghi chú kỹ thuật

- Bảng `user_activity_log` (id, user_id, session_id, action, target_type, target_id, metadata, created_at)
  - `target_type`: `product` / `category` / `search`
  - `target_id`: ID của sản phẩm/danh mục tương ứng
  - `metadata`: JSON — lưu thêm data (keyword tìm kiếm, thời gian xem, ...)
- API endpoints:
  - `POST /api/v1/activity` — ghi nhận hành vi (frontend gọi mỗi khi user thực hiện action)
  - `GET /api/v1/recommendations` — lấy danh sách gợi ý cá nhân hóa
  - `GET /api/v1/products/:id/similar` — sản phẩm tương tự
- Scoring service chạy **on-demand** khi gọi API (không cần pre-compute cho quy mô đồ án)
- **Redis cache**: cache scoring result per user (TTL ~30 phút) → tránh tính lại mỗi lần load trang chủ
- Kết hợp Module 18 (Recently Viewed) — không gợi ý lại SP đã xem gần đây
- Seed data: tạo ~50-100 activity records mẫu cho 3-5 user để demo có ý nghĩa

---

## Module 23 — Hoàn Xu (Cashback Coins)

> **Phase 6** · Phụ thuộc: Module 7 (Order) · *Triển khai độc lập*

### Mô tả

Hệ thống **hoàn Xu** (cashback) kiểu Shopee Xu / Lazada: khách hàng **tích Xu** khi đơn hoàn thành, **dùng Xu** khi thanh toán để giảm giá, và Xu **hết hạn** theo lô sau N ngày. **1 Xu = 1 ₫**, Xu là số nguyên. Tăng retention, khuyến khích mua lại.

### Chức năng

- **Tích Xu (earn):** khi đơn chuyển `completed` (khách xác nhận nhận hàng, admin/seller cập nhật, hoặc cron auto-complete) → cộng Xu = `floor(base × earn_rate%)`, với `base = tổng tiền hàng sau giảm giá, KHÔNG tính phí ship & phần đã trả bằng Xu` (chống farm Xu). Idempotent theo đơn.
- **Dùng Xu (redeem):** khi checkout, khách chọn số Xu dùng — giới hạn **tối đa 50%** tổng tiền hàng (sau coupon) mỗi đơn và không vượt số dư. Xu được tiêu **FIFO** (lô sắp hết hạn trước), phân bổ xuống các sub-order đa-shop theo headroom.
- **Hết hạn (expiry):** mỗi lô Xu có `expires_at = now + expiry_days` (mặc định 90 ngày); cron hằng ngày đánh dấu lô quá hạn thành `expired`, loại khỏi số dư.
- **Hoàn Xu khi hủy đơn:** hủy đơn đã dùng Xu → tạo lô Xu mới hoàn lại (reset hạn); hủy đơn đã tích Xu → thu hồi phần Xu **chưa tiêu** của lô đó (không ép số dư âm). Idempotent.
- **Ví Xu (customer):** trang xem số dư, "Xu sắp hết hạn", và lịch sử giao dịch (sổ cái phân trang).
- **Cấu hình động (admin):** bật/tắt tính năng, `earn_rate_percent`, `redeem_max_percent`, `expiry_days` chỉnh runtime qua Admin UI (lưu ở bảng `app_settings` key/value — pattern mới, không cần deploy lại).

### Trạng thái lô Xu & giao dịch

```
Lô (coin_batches):        active → depleted | expired | reversed
Giao dịch (ledger types): earn / redeem / expire / reverse_earn / refund
```

### Ghi chú kỹ thuật

- **3 bảng mới:** `app_settings` (config key/value), `coin_batches` (lô Xu — nguồn chân lý số dư + FIFO + hết hạn), `coin_transactions` (sổ cái bất biến). Thêm cột `orders.coin_discount` (snapshot Xu đã dùng mỗi sub-order).
- **⚠️ Cascade path (SQL Server 1785):** `coin_transactions.batch_id` FK là **NO ACTION** (không CASCADE/SET NULL) — nếu không sẽ có 2 đường cascade từ `users` (trực tiếp + qua `coin_batches`). Cùng cách `messages.sender_id` (Module 20) đã né.
- **Không dùng listener** cho earn/reverse: `CoinService` được `OrderService`/`OrderScheduler` gọi **đồng bộ** (mirror `handleCouponReversalOnCancel` của coupon) — tránh circular dep vì `CoinModule` không thể import `OrderModule`.
- **Phân bổ Xu đa-shop:** tái dùng `allocateWithCaps` (từ coupon-distribution.util) — weights/caps = headroom mỗi shop (`itemsTotal − couponDiscount`), đảm bảo `total_amount ≥ 0`; số Xu thực dùng = Σ allocation (có thể < yêu cầu khi coupon lớn).
- **Earn base = `total_amount − shipping_fee`** (total đã trừ coupon & Xu) → tự động loại ship và phần trả bằng Xu.
- **Permission:** `settings:read` / `settings:update` (admin-only) cho cấu hình; endpoint Xu của customer chỉ JWT.
- **Cron:** `@Cron(EVERY_DAY_AT_1AM)` quét lô hết hạn. **Redis cache** (dự kiến): cache số dư/scoring nếu cần.

---

## Yêu cầu phi chức năng

| Yêu cầu | Chi tiết |
|----------|---------|
| **Responsive UI** | Tương thích tốt với mobile, tablet, desktop — Tailwind CSS v4 |
| **Hiệu năng** | Xử lý bất đồng bộ, tối ưu query với database indexing trên các trường tìm kiếm thường xuyên |
| **Bảo mật** | JWT + Refresh Token, Dynamic RBAC, input validation (Zod), SQL injection prevention (TypeORM) |
| **SEO** | Auto-generate slug cho product và category |
| **Data Integrity** | Immutable snapshot cho order, coupon reversal giữ audit trail |
| **Caching** | Redis cache cho permission, Flash Sale, notification count, recommendation scoring — giảm tải DB |
| **Realtime** | Socket.IO cho chat và notifications (dùng chung gateway) |
