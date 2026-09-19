# BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN TỐT NGHIỆP
**Đề tài:** Xây dựng hệ thống thương mại điện tử bán hàng trực tuyến
**Nhóm sinh viên:** Ngô Hy Khang, Bùi Minh Tuấn

Dưới đây là danh sách các câu hỏi (và gợi ý trả lời) mà Hội đồng chấm thi có thể đặt ra dựa trên kiến trúc và tính năng của hệ thống, được chia theo từng khía cạnh kỹ thuật.

---

## I. Kiến trúc Hệ thống & Tổng quan

**Câu 1: Dự án áp dụng mô hình kiến trúc gì? Tại sao các bạn lại lựa chọn kiến trúc này cho hệ thống E-commerce?**
**Trả lời:** 
Hệ thống áp dụng kiến trúc Feature-based Layered Architecture (Kiến trúc phân lớp theo tính năng). Mã nguồn backend (NestJS) được tổ chức thành các module tính năng độc lập (26 module như Auth, Product, Order, Chat...). Trong mỗi module lại chia thành các layer như Controller, Service, Repository. 
*Lý do:* Hệ thống E-commerce có số lượng module lớn và phức tạp. Việc chia theo Feature giúp cô lập logic, dễ phân chia công việc, dễ bảo trì và mở rộng sau này (ví dụ tách thành Microservices dễ dàng hơn).

**Câu 2: Hệ thống quản lý Realtime cho Chat và Notification như thế nào để tối ưu tài nguyên?**
**Trả lời:** 
Hệ thống sử dụng **Socket.IO Gateway dùng chung** cho cả Chat và Notification, nghĩa là client chỉ mở 1 kết nối WebSocket duy nhất thay vì tạo nhiều connection rời rạc. 
Khi user online, backend tạo bản ghi vào DB đồng thời emit event qua Socket.IO. Nếu user offline, dữ liệu vẫn được lưu DB và khi họ online trở lại, hệ thống có cơ chế Fallback REST API để lấy dữ liệu chưa đọc.

---

## II. Quản lý Người dùng & Bảo mật

**Câu 3: Hãy giải thích cơ chế phân quyền (Authorization) Dynamic RBAC mà dự án đang sử dụng. Làm sao để kiểm tra quyền trên mỗi API request mà không làm chậm hệ thống?**
**Trả lời:** 
Cơ chế Dynamic RBAC ánh xạ `Role ↔ Permission → API Endpoint`. Admin có thể tạo Role mới và gán các Permission linh hoạt.
Để kiểm tra quyền không làm chậm hệ thống, danh sách Permission của mỗi Role được **Cache in-memory** (TTL 60s). Mỗi request đi qua middleware/guard trên NestJS sẽ check quyền từ Cache này thay vì query DB liên tục. (Có hướng mở rộng dùng Redis nếu scale-out).

**Câu 4: Tại sao hệ thống cần lưu Refresh Token trong Database? Có bắt buộc không?**
**Trả lời:** 
Việc lưu Refresh Token trong DB không bắt buộc theo chuẩn JWT, nhưng **rất cần thiết cho hệ thống E-commerce** nhằm mục đích bảo mật:
1. Hỗ trợ **Token Revocation**: Cho phép thu hồi token (đăng xuất hoặc cưỡng chế đăng xuất từ xa).
2. Hỗ trợ **Multi-device tracking**: Kiểm soát và quản lý các thiết bị đang đăng nhập của một tài khoản. 

---

## III. Cơ sở Dữ liệu & Tính toàn vẹn Dữ liệu

**Câu 5: Trong luồng mua hàng, nếu khách đã đặt hàng xong (đơn giá 100k), ngày hôm sau Seller đổi giá sản phẩm thành 120k thì làm sao để lịch sử đơn hàng không bị thay đổi?**
**Trả lời:** 
Hệ thống sử dụng cơ chế **Immutable Snapshot (Lưu cứng)**. Khi đơn hàng được tạo, các thông tin quan trọng như: tên sản phẩm, hình ảnh, biến thể (variant), đơn giá tại thời điểm mua, và địa chỉ giao hàng đều được copy và lưu cứng vào bảng `Order` và `OrderItem`. Nhờ đó, mọi thay đổi ở bảng `Product` sau này sẽ không ảnh hưởng đến lịch sử giao dịch đã chốt.

**Câu 6: Nếu đơn hàng bị hủy mà khách hàng đã dùng Mã giảm giá (Coupon), hệ thống xử lý hoàn lại lượt dùng như thế nào? Xóa record hay cập nhật record?**
**Trả lời:** 
Hệ thống áp dụng cơ chế **Auto-reversal**. Thay vì xóa record `coupon_usage` (làm mất tính toàn vẹn của audit trail), hệ thống sẽ tạo một record mới với thuộc tính `type = reversal` để bù trừ. Cách này giúp lưu lại toàn bộ dấu vết: user đã dùng mã khi nào, và mã được hoàn lại vì lý do hủy đơn khi nào.

**Câu 7: Tránh lỗi Cascade deletion ở SQL Server (lỗi 1785) như thế nào trong trường hợp Ví người bán (Wallet) và Hoa hồng (Commission)?**
**Trả lời:** 
Hệ thống set thuộc tính Foreign Key là **NO ACTION** (thay vì CASCADE hay SET NULL) cho các cột như `wallet_transactions.withdrawal_id` hoặc `wallet_transactions.order_id`. Điều này giúp tránh 2 đường cascade đồng thời (từ users qua orders/wallets), vốn là nguyên nhân gây lỗi multiple cascade paths trong SQL Server.

---

## IV. Luồng Mua hàng & Thanh toán

**Câu 8: Trong chức năng tích hợp thanh toán VNPay/MoMo, điều gì xảy ra nếu người dùng thanh toán xong nhưng mạng chập chờn, gateway gọi API Callback (IPN) đến server của bạn 2-3 lần cho cùng 1 đơn hàng?**
**Trả lời:** 
Hệ thống xử lý bằng cơ chế **Idempotency**. Backend lưu lịch sử giao dịch ở bảng `payment_transactions`. Khi nhận IPN từ VNPay/MoMo, hệ thống:
1. Verify chữ ký HMAC signature để đảm bảo request hợp lệ.
2. Kiểm tra `transaction_ref` (mã giao dịch): nếu mã này đã được xử lý (trạng thái completed) thì server sẽ bỏ qua và trả về HTTP 200 cho Gateway, không cập nhật lại đơn hàng, tránh tình trạng xử lý trùng lặp.

**Câu 9: Hệ thống giải quyết bài toán trừ sai/farm "Xu hoàn tiền" (Cashback) như thế nào? Tiêu xu tuân theo nguyên tắc gì?**
**Trả lời:** 
- **Chống farm Xu**: Công thức tính base cộng xu là `Tổng tiền hàng - Phí ship - Phần trả bằng Xu`. Việc loại trừ phí ship và phần giá trị thanh toán bằng chính Xu giúp chống lạm dụng.
- **Tiêu xu**: Hệ thống giới hạn tiêu tối đa 50% tiền hàng. Việc tiêu xu áp dụng nguyên tắc **FIFO** (lô xu nào gần hết hạn sẽ được trừ trước).

---

## V. Tính năng Nâng cao (AI & Flash Sale)

**Câu 10: AI Chatbox trong dự án của bạn khác gì với một Chatbot RAG thông thường? Khách hàng có thể bị mất tiền oan nếu AI tự động đặt hàng không?**
**Trả lời:** 
- Điểm khác biệt là AI Chatbox hoạt động như một **Shopping Agent** (có khả năng Tool-calling). Không chỉ trả lời RAG, nó có thể tự động gọi API (thêm/sửa giỏ hàng, tra cứu/hủy đơn).
- **Tuyệt đối không mất tiền oan**: Với thao tác liên quan đến đặt hàng, AI giới hạn ở mức **đề xuất (propose_checkout)**. Giao diện sẽ render một thẻ mini-checkout, bắt buộc người dùng thực sự (Human-in-the-loop) bấm nút "Xác nhận", chọn địa chỉ và thanh toán. 
- Bảo mật: Danh tính (user_id) được lấy trực tiếp từ session/JWT của request chứ không tin tưởng vào tham số mà LLM truyền về.

**Câu 11: Làm sao bạn hiện thực tính năng Tìm kiếm bằng hình ảnh (Visual Search)?**
**Trả lời:** 
Khi user upload ảnh lên web, backend gửi ảnh đó đến Vision Model (thông qua OpenRouter). AI sẽ phân tích hình ảnh và trả về JSON chứa các thuộc tính nhận diện được như: danh mục (category), màu sắc, chất liệu, phong cách... Từ chuỗi JSON này, hệ thống sẽ build một câu truy vấn động (dynamic WHERE query) xuống Database để tìm ra các sản phẩm khớp nhất và trả về cho người dùng.

**Câu 12: Trong chức năng Flash Sale, làm thế nào để đảm bảo sản phẩm hiển thị đúng giá Sale khi có hàng nghìn lượt truy cập cùng lúc vào khung giờ vàng?**
**Trả lời:** 
Hệ thống sử dụng một Background Job (Cron) tự động chuyển trạng thái của Flash Sale campaign từ `scheduled → active`. Service lấy giá `FlashSaleService.getActiveFlashPriceMap` sẽ kiểm tra trạng thái campaign và status của đăng ký (`approved`). Giá này là "nguồn chân lý" được áp dụng tự động cho giỏ hàng và checkout. Để tối ưu khi lượng truy cập cao, tương lai cần áp dụng Cache Redis cho dữ liệu Flash Sale thay vì truy vấn thẳng vào PostgreSQL liên tục.

---

## VI. Thống kê & Gợi ý (Recommendations)

**Câu 13: Tính năng Gợi ý thông minh (Smart Recommendations) của nhóm dùng thuật toán gì? Cụ thể cách tính điểm (scoring) như thế nào?**
**Trả lời:** 
Hệ thống dùng thuật toán **Content-based Filtering** dựa trên Activity Log (hành vi người dùng: xem, tìm kiếm, mua).
Việc tính điểm dựa trên việc xây dựng User Profile Vector. Sản phẩm sẽ được cộng điểm tương đồng theo trọng số:
- Thuộc danh mục ưa thích: tối đa +3 điểm (tỉ lệ thuận với độ ưa thích).
- Thuộc khoảng giá hay mua (percentile 10-90 để loại bỏ outlier): +2 điểm.
- Thuộc Shop đã mua: +1 điểm.
- Tín hiệu cũ sẽ bị giảm trọng số theo thời gian (recency decay, half-life 30 ngày). Sản phẩm có điểm cao nhất sẽ được gợi ý.

**Câu 14: Tại sao trong tính năng Trang trí Shop (Shop Decoration) lại lưu dữ liệu dưới dạng JSON vào 1 cột thay vì tạo bảng mới?**
**Trả lời:** 
Vì tính linh hoạt. Khối trang trí dạng Block-builder có cấu trúc dữ liệu rất biến động (có khối chữ, khối ảnh, khối slide, lưới sản phẩm). Nếu tạo bảng SQL rời rạc sẽ rất khó mở rộng và bảo trì. Lưu dạng JSON config cho phép versioning (version: 1, blocks: [...]) dễ dàng thêm loại khối mới về sau mà không cần thay đổi schema Database hay API endpoint. Việc kiểm tra tính hợp lệ của dữ liệu (validation) được xử lý chặt chẽ ở DTO tầng BE.
