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
