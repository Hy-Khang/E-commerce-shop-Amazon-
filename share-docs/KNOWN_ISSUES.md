# KNOWN ISSUES — Bug đã ghi nhận, xử lý sau

> File tổng hợp các bug đã phát hiện nhưng **cố ý chưa sửa** để tránh mở rộng scope
> ngoài task đang làm. Mỗi mục ghi rõ nguyên nhân + hướng sửa để lần sau xử lý nhanh.

---

## ISSUE-001 — Admin/Seller order detail gọi endpoint payment customer-scoped → 404

- **Ngày phát hiện:** 2026-08-19
- **Trạng thái:** OPEN (chưa sửa)
- **Mức độ:** Thấp (chỉ ồn Console + panel giao dịch không load cho admin; không làm vỡ trang)
- **Khu vực:** `payment` (BE) × `order` (FE admin/seller order detail)
- **KHÔNG liên quan** tới việc order-tracking map / 17 type-fix vừa làm (đã kiểm chứng bằng
  `git show` commit `5e6b1b9`: commit đó chỉ thêm `OrderTrackingMap`, không đụng
  `PaymentTransactionList`). Đây là bug có sẵn từ trước.

### Triệu chứng
```
payment.service.ts:14  GET http://localhost:3000/api/v1/payments/order/33 404 (Not Found)
```
Xảy ra khi **admin** (và tương tự sẽ xảy ra với các viewer không phải chủ đơn) mở
trang chi tiết đơn có render `PaymentTransactionList`.

### Nguyên nhân gốc
Endpoint `GET /payments/order/:orderId` là **customer-owner-scoped**:

- BE `getPaymentsByOrder(orderId, userId)` gọi
  `orderService.findOrderForPayment(orderId, userId)` →
  `orderRepository.findByIdAndUserId(orderId, userId)`.
- Admin **không phải chủ đơn** (`user_id` khác) → trả `null` →
  ném `NotFoundException { code: 'ORDER_001' }` → HTTP 404.
- API_SPEC cũng chỉ định nghĩa endpoint này cho **Customer**, chưa có bản admin/seller.

### Repro
1. Đăng nhập admin, mở `/admin/orders/:id` (một đơn không thuộc tài khoản admin).
2. Xem Console → 404 ở `GET /api/v1/payments/order/:id`.

### File liên quan
- FE render: `frontend-react/src/features/order/pages/AdminOrderDetailPage.tsx`
  (và `OrderDetailPage.tsx` cho customer — customer là chủ đơn nên KHÔNG lỗi)
- FE component: `frontend-react/src/features/payment/components/PaymentTransactionList.tsx:31`
  → `usePaymentsByOrder(orderId)`
- FE hook: `frontend-react/src/features/payment/hooks/usePaymentsByOrder.ts:9`
  (đã có sẵn tham số `enabled` — dùng được cho hướng B)
- FE service: `frontend-react/src/features/payment/services/payment.service.ts:14`
- BE controller: `backend-nestjs/src/features/payment/payment.controller.ts:81` `getPaymentsByOrder`
- BE service: `backend-nestjs/src/features/payment/payment.service.ts:418` (throw `ORDER_001` ~L427)
- BE order service: `backend-nestjs/src/features/order/order.service.ts:948` `findOrderForPayment`

### Hướng sửa (chọn 1 khi xử lý)
- **A. Backend cho admin/seller xem được (nếu cần hiển thị giao dịch cho họ):**
  nới `getPaymentsByOrder` — nếu user có quyền `orders:read` (admin/seller) thì tra theo
  `orderId` không ép owner; giữ nhánh owner cho customer. Lưu ý phân quyền/seller-scope
  (seller chỉ nên xem đơn thuộc shop mình).
- **B. Frontend ẩn panel (nhanh, nếu admin không cần):**
  ở `AdminOrderDetailPage` không render `PaymentTransactionList`, hoặc truyền
  `usePaymentsByOrder(orderId, /* enabled */ false)` / gate theo role.

### Ghi chú
Nên xử lý ở **commit/PR riêng** thuộc scope `payment`, không trộn vào order-tracking.

---

## ISSUE-002 — Form Edit product chặn Save "im lặng" với sản phẩm seed (zod regex thumbnail_url quá hẹp)

- **Ngày phát hiện:** 2026-08-28
- **Trạng thái:** ✅ FIXED (2026-08-28, hướng A)
- **Mức độ:** Trung bình (không sửa được bất kỳ sản phẩm seed nào qua form admin — chặn workflow, nhưng không vỡ trang / không mất dữ liệu)
- **Khu vực:** `product` (FE admin — zod schema form)

> **Đã sửa:** nới regex `thumbnail_url` tại `product.types.ts:244` thành
> `/^\/uploads\/products\/[\w./-]+\.(jpg|jpeg|png|webp)$/i` — chấp nhận subfolder +
> tên file tự do (khớp cả upload thực tế lẫn seed). Nhánh URL http/https giữ nguyên.

### Triệu chứng
Vào `/admin/products/:id/edit` một sản phẩm **seed**, sửa field bất kỳ (Name, Price...) rồi bấm **Save** → không có gì xảy ra, không toast, không điều hướng. Nhìn như nút Save "chết".

### Nguyên nhân gốc
`createProductSchema.thumbnail_url` (dùng chung cho cả form Edit) có `.refine()` với regex chỉ chấp nhận **đúng 2 dạng**:

- `frontend-react/src/features/product/types/product.types.ts:244`
  ```
  /^\/uploads\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/
  ```
  → path nội bộ **chỉ** dạng `/uploads/products/<uuid-v4>.<jpg|png|webp>`, hoặc
- một URL `http(s)://...` hợp lệ.

Nhưng `thumbnail_url` của **seed** dùng path **lồng thư mục + tên slug**, không phải UUID:
- `backend-nestjs/src/core/database/seeds/product.seed.ts:197` → `/uploads/products/ao/ao-khoac-non-branded-04-den-1174884707.webp`
- `...seed.ts:221` → `/uploads/products/laptop/1711078092373-asus-01.png`

→ Giá trị pre-fill từ server **không khớp regex** → khi `handleSubmit` chạy, RHF validate toàn form → `thumbnail_url` fail → **submit bị chặn**, mặc dù user không hề chỉnh field này.

### Vì sao "im lặng"
Error **có** được render (`AdminProductEditPage.tsx:269`, `errors.thumbnail_url`), nhưng nằm **ngay dưới widget `ImageUpload` "Thumbnail"** — cách xa nút Save ở cuối form. User đang nhìn field mình sửa (Name/Price ở trên) → không thấy dòng lỗi đỏ dưới ảnh → tưởng Save không phản hồi.

### Repro
1. `npm run seed` (hoặc DB đã seed sẵn).
2. Admin → `/admin/products` → mở Edit một sản phẩm seed.
3. Đổi Name → bấm Save → không phản hồi. Cuộn xuống mục Thumbnail sẽ thấy *"Must be a valid image URL or uploaded image"*.

### File liên quan
- FE schema (root cause): `frontend-react/src/features/product/types/product.types.ts:239-250` (regex L244)
- FE form Edit: `frontend-react/src/features/product/pages/AdminProductEditPage.tsx:157` (pre-fill), `:263-269` (render + error)
- FE form Create: cùng schema — Create ít lộ lỗi hơn vì thumbnail thường rỗng hoặc vừa upload đúng format UUID
- Seed data (đối chứng format): `backend-nestjs/src/core/database/seeds/product.seed.ts:197+`

### Hướng sửa (chọn 1 khi xử lý)
- **A. Nới regex cho khớp mọi path upload hợp lệ (khuyến nghị):** thay pattern UUID-only bằng pattern chấp nhận subfolder + tên file tự do, ví dụ
  `/^\/uploads\/products\/[\w./-]+\.(jpg|jpeg|png|webp)$/i` (vẫn giữ nhánh URL http/https). Đây là cách đúng vì cả upload thực tế lẫn seed đều sinh path lồng thư mục.
- **B. Chỉ validate khi user thực sự đổi ảnh:** vì `thumbnail_url` là giá trị server-controlled, có thể bỏ `.refine()` chặt (chỉ cần string optional) và tin tưởng nguồn từ `ImageUpload.onUploaded` / server. Giảm rủi ro nhưng mất lớp chặn URL rác nếu sau này cho nhập tay.
- **C. (bổ trợ, không thay A/B) Lộ lỗi rõ hơn:** khi submit bị chặn, focus/scroll tới field lỗi đầu tiên (RHF `shouldFocusError` mặc định true nhưng `ImageUpload` không phải input focusable) — cân nhắc hiện lỗi tổng ở gần nút Save.

### Ghi chú
Fix thuộc scope `product` (FE). Nên kèm một product seed có thumbnail đúng-định-dạng-mới để test không regress. Xem thêm memory `project_bug_product_thumbnail_regex`.
