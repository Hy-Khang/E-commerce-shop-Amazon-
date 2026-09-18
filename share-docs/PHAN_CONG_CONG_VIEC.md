# Phân công công việc — theo lịch sử commit Git

> Nguồn dữ liệu: `git log` (toàn bộ nhánh). Bảng dưới đây tổng hợp công việc thực tế của từng thành viên dựa trên tác giả commit và mốc thời gian.

## Thành viên

| Tên | Git author | Email |
|-----|------------|-------|
| **Ngô Hy Khang** (725000187) | `Hy-Khang` | khangngodev@gmail.com |
| **Bùi Minh Tuấn** (725000686) | `minhtuan1012bt-coder` | minhtuan1012bt@gmail.com |

---

## Tổng quan phân chia module

| Thành viên | Các Module / Feature phụ trách |
|-----------|--------------------------------|
| **Ngô Hy Khang** | Khởi tạo dự án & kiến trúc (BE NestJS + FE React), Module 1 Auth & Security (+OAuth), Module 2 User Profile & Addresses, Module 3 Image Upload, Module 4 Shop Management, Module 5 Product Catalog, Module 6 Cart & Checkout, Module 7 Order Management, Module 8 Payment Gateway (VNPay/MoMo), Module 9 Coupons (platform), Module 10 Wishlist & Reviews, Module 11 Notifications (WebSocket), Module 12 Search & Filter (+Visual Search), Module 13 Admin Panel, Module 14 Seller Dashboard, Module 15 Shipper Dashboard, Module 21 AI Chatbox → Shopping Agent, Module 22 Smart Recommendations, Theme sáng/tối, Migrate Supabase (Postgres), Deploy (Render), Testing BE, Lint/refactor |
| **Bùi Minh Tuấn** | Module 16 Order Tracking (timeline + bản đồ shipper), Module 9 Coupons — Shop Coupons (seller CRUD, multi-coupon, voucher picker/cart/checkout UX), Module 17 Flash Sale, Module 18 Recently Viewed, Module 19 Product Comparison, Module 20 Chat Realtime, Module 23 Hoàn Xu (Cashback), Module 24 Seller Onboarding, Module 25 Commission & Wallet, Module 26 Shop Decoration |

---

## Timeline chi tiết

### Ngô Hy Khang

| Thời gian | Module / Feature | Commit tiêu biểu |
|-----------|------------------|------------------|
| 2026-04-27 | Khởi tạo dự án (NestJS 11 + React 19) | initial project setup |
| 2026-05-07 → 05-09 | Thiết lập kiến trúc, cấu trúc thư mục BE/FE, skill be/fe-crud & test | init folder structure |
| 2026-05-09 → 05-10 | Module 1 — Auth & Security (BE/FE CRUD, test, RBAC user/role admin) | be-crud auth, fe-crud auth |
| 2026-05-10 → 05-13 | Module 2 — User Profile & Addresses | be/fe-crud user-profile |
| 2026-05-10 → 05-11 | Module 6 — Cart (BE/FE) | be-crud cart, fe-crud cart |
| 2026-05-11 | Module 5 — Product (FE) | fe-crud product |
| 2026-05-11 → 05-13 | Module 7 — Order & Checkout (transaction, FE) | do transaction for checkout order |
| 2026-05-11 → 05-23 | Module 10 — Reviews | be-crud review, review system |
| 2026-05-28 → 05-29 | Testing BE (Auth, UserProfile, Product, Cart, Order, Review) | test suites |
| 2026-05-28 → 06-04 | Module 13 — Admin (category management, order management, RBAC controllers) | admin category, RBAC system |
| 2026-06-01 → 06-02 | Module 10 — Wishlist | wishlist feature module |
| 2026-06-02 | Module 9 — Coupons (platform, full-stack) | coupon management system |
| 2026-06-03 | Module 3 — Image Upload + seeding | image upload feature, DB seeding |
| 2026-06-05 | Module 13/14/15 — Admin Dashboard, Seller Center, Shipper Portal, Permissions FE | admin dashboard, Seller Center, Shipper Portal |
| 2026-06-08 → 06-09 | Module 4 — Shop model, Product Detail (variant image switching) | add shop model, product detail page |
| 2026-06-09 → 06-13 | Module 11 — Notifications + Homepage modules | notification system, homepage modules |
| 2026-06-11 | Module 7 — Order Confirmation/Return/Auto-Complete (4 phase) | order confirmation + return/refund |
| 2026-07-22 | Module 1 — Auth hoàn chỉnh (verify email, forgot/reset, OAuth Google/FB) | Auth & Security fully implemented |
| 2026-07-23 | Module 8 — Payment Gateway (VNPay + MoMo) | full payment integration |
| 2026-07-24 | Module 12 — Visual Search + product navigation | visual search |
| 2026-07-25 | Module 15 — Shipper module (order mgmt, dashboard, seeding) | shipper module |
| 2026-08-01 | Module 11 — Realtime notification (WebSocket) | real-time notification system |
| 2026-08-23 → 08-27 | Lint cleanup, Git Flow docs, Theme sáng/tối (storefront + portals) | lint fixes, theme light/dark |
| 2026-08-24 → 08-25 | Module 13/14 — Admin/Seller filters, dashboard period selector + growth % | admin/seller filters, period selector |
| 2026-08-28 | Module 5/8 — Admin shop assignment, fix payment admin view (ISSUE-001) | admin shop select, payment fix |
| 2026-09-01 → 09-04 | Module 21 — AI Chatbox → AI Shopping Agent (RAG, tool-calling, mini-checkout, UX round 2) | AI Chatbox, AI Shopping Agent |
| 2026-09-05 → 09-14 | Module 22 — Smart Recommendations (scoring, AI reason, rail UX) | Smart Recommendations |
| 2026-09-14 | Homepage cohesion (section shell thống nhất) | refactor home |
| 2026-09-14 → 09-15 | Migrate Supabase (Postgres + Storage), fix money column overflow | migrate SQL Server → Supabase |
| 2026-09-15 → 09-16 | Deploy Render (config, health check, build fixes) | Render config, fix render build |
| 2026-09-18 | Module 5 — Auto-uniquify slug, editable variants/images, rich-text description | product slug + variants |

### Bùi Minh Tuấn

| Thời gian | Module / Feature | Commit tiêu biểu |
|-----------|------------------|------------------|
| 2026-08-12 | Module 16 — Order Tracking (Phase 1: Backend) | order tracking - phase 1: BE |
| 2026-08-14 | Module 16 — Order Tracking (Phase 2: Frontend) | order tracking - phase 2: FE |
| 2026-08-17 → 08-19 | Module 16 — Order Tracking (fix bugs, map styling, routing, location visibility) | order tracking fix bugs, map styling |
| 2026-08-19 | Fix TypeScript build errors + log ISSUE-001 | resolve TS build errors |
| 2026-08-19 → 08-21 | Module 9 — Shop Coupons (Phase 1→5: seller CRUD, multi-coupon checkout, admin lock, discount waterfall, voucher picker, cart & checkout UX) | shop coupons phase 1–5 |
| 2026-08-29 → 08-30 | Module 17 — Flash Sale (shop registration + admin approval) | flash-sale registration/approval |
| 2026-08-30 | Module 18 — Recently Viewed | recently-viewed lịch sử sản phẩm |
| 2026-08-30 → 08-31 | Module 20 — Chat Realtime Customer ↔ Seller (unread badge, guest login return, seed + tests, scroll UI) | Chat Realtime |
| 2026-08-31 | Module 23 — Hoàn Xu / Cashback Coins (full stack) | Hoàn Xu (Cashback Coins) |
| 2026-09-03 | Module 19 — Product Comparison (so sánh sản phẩm) + fix coin type | Product Comparison |
| 2026-09-05 | Module 24 + 25 — Seller Onboarding + Commission/Wallet | seller-finance onboarding |
| 2026-09-05 | Module 26 — Shop Decoration (block builder) | shop decoration block builder |

---

## Thống kê nhanh

| Thành viên | Giai đoạn hoạt động chính | Số module chính phụ trách |
|-----------|---------------------------|---------------------------|
| Ngô Hy Khang | 04/2026 → 09/2026 (nền tảng + phần lớn Phase 1–5 + AI/Recommendations + hạ tầng/deploy) | ~18 module |
| Bùi Minh Tuấn | 08/2026 → 09/2026 (Order Tracking, Shop Coupons + phần lớn Phase 6) | ~9 module |
