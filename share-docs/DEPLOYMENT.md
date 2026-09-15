# DEPLOYMENT.md — Hướng dẫn triển khai production

Kiến trúc deploy: **Frontend (Vercel) → Backend (Render) → Database + Storage (Supabase)**.

```
[Vercel: React]  --HTTPS/WebSocket-->  [Render: NestJS API]  --SSL-->  [Supabase: Postgres + Storage]
```

Tài liệu này là runbook cho người deploy. Làm theo đúng thứ tự. Phần code hỗ trợ (health endpoint, cap pool, `render.yaml`) đã có sẵn trong repo.

---

## ⚠️ Điều PHẢI biết trước: Render Free tier "ngủ đông"

Web service **free** trên Render **spin down sau ~15 phút không có request** (cold start ~50s). Điều này ảnh hưởng trực tiếp tới dự án:

- **Cron jobs KHÔNG chạy khi service ngủ** → order không tự `completed` (cron 7 ngày), Xu không hết hạn (cron 1AM), payment pending không bị `failed` (cron 15 phút), flash sale không đổi trạng thái.
- **Socket.IO** (chat + notification) rớt kết nối, client phải reconnect.
- **Payment IPN** từ VNPay/MoMo có thể timeout nếu gọi lúc service đang cold.

**Chọn 1 trong 2:**
1. **Render Starter ($7/tháng)** — không ngủ. Sạch nhất nếu buổi bảo vệ cần ổn định.
2. **Free + keep-alive ping**: dùng [cron-job.org](https://cron-job.org) hoặc [UptimeRobot](https://uptimerobot.com) ping `https://<APP_URL>/api/v1/health` mỗi **10 phút**. (Chấp nhận được cho đồ án; vẫn không đảm bảo cron chạy đúng mốc 1AM nếu service vừa tỉnh.)

---

## Bước 1 — Supabase (Database + Storage)

1. **Connection string — dùng Session Pooler** (IPv4, port 5432; host direct là IPv6-only, fail trên Render):
   - Supabase → Project Settings → Database → Connection string → **Session pooler**.
   - Lấy: `DB_HOST` (dạng `aws-0-<region>.pooler.supabase.com`), `DB_USERNAME` (`postgres.<project-ref>`), `DB_PASSWORD`, `DB_PORT=5432`, `DB_DATABASE=postgres`.
2. **Schema**: nếu đã chạy ETL migration (SQL Server → Supabase) thì schema đã có sẵn. Nếu DB trống:
   - Cách nhanh (đồ án): tạm set `DB_SYNCHRONIZE=true`, chạy app 1 lần để TypeORM tạo bảng, rồi **set lại `false`**.
   - Lưu ý: **filtered UNIQUE index** (vd `uq_seller_applications_user_pending ... WHERE status='pending'`, `uq_flash_sale_items_sale_variant`) synchronize KHÔNG tạo được → phải chạy SQL thủ công (xem `sql/` và `DATABASE.md`).
   - Sau khi có schema, chạy seed nếu cần: `npm run seed`.
3. **Storage bucket**: tạo bucket **public** tên `product-images` (Storage → New bucket → Public). Lấy `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Settings → API). Service-role key là **backend-only**, không bao giờ đưa lên frontend.

---

## Bước 2 — Backend lên Render

**Cách A — Blueprint (khuyên dùng):** repo đã có `render.yaml`. Render Dashboard → New + → **Blueprint** → chọn repo → Render đọc `render.yaml` và tạo service, chỉ hỏi các biến `sync:false`.

**Cách B — Thủ công:** New + → Web Service → chọn repo, cấu hình:
- **Root Directory:** `backend-nestjs`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run start:prod`
- **Health Check Path:** `/api/v1/health`

**Environment Variables cần set** (xem đầy đủ trong `render.yaml` / `backend-nestjs/.env.example`):

| Nhóm | Biến | Lưu ý |
|------|------|-------|
| Core | `NODE_ENV=production`, `TZ=UTC`, `APP_PREFIX=api/v1` | `TZ=UTC` bắt buộc |
| URL | `CORS_ORIGIN`=domain Vercel · `APP_URL`=URL Render · `FRONTEND_URL`=domain Vercel | không dấu `/` cuối |
| DB | `DB_HOST/PORT/USERNAME/PASSWORD/DATABASE`, `DB_SSL=true`, **`DB_SYNCHRONIZE=false`**, `DB_POOL_MAX=5` | pooler port 5432 |
| Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=product-images` | |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (chuỗi random mạnh) | Blueprint tự `generateValue` |
| SMTP | `SMTP_HOST/PORT/USER/PASS/FROM` | Mailtrap (demo) hoặc SMTP thật |
| OAuth | `GOOGLE_*`, `FACEBOOK_*` + callback URL | xem Bước 4 |
| Payment | `VNPAY_*`, `MOMO_*` + return/IPN URL | xem Bước 5 |
| AI | `OPENROUTER_API_KEY` + model | cần credit OpenRouter |

> **`DB_SYNCHRONIZE` PHẢI = `false`** trên production — nếu không TypeORM có thể tự sửa schema thật.

---

## Bước 3 — Frontend lên Vercel

1. Import repo → **Root Directory:** `frontend-react` (Vercel tự nhận Vite).
2. **Environment Variable:**
   - `VITE_API_BASE_URL=https://<APP_URL>/api/v1` (URL Render + `/api/v1`).
   - (Tùy chọn) `VITE_ORS_API_KEY`, `VITE_MAPTILER_KEY` cho bản đồ order tracking.
3. `vercel.json` đã có sẵn rewrite `/(.*) → /index.html` cho SPA routing (React Router v7) → không lỗi 404 khi F5.
4. Deploy xong, lấy domain Vercel (vd `https://your-app.vercel.app`) → quay lại Render set `CORS_ORIGIN` + `FRONTEND_URL` = domain này, rồi redeploy backend.

> **Thứ tự "con gà–quả trứng":** deploy BE trước để có `APP_URL`, deploy FE để có domain Vercel, rồi cập nhật CORS/callback URL hai đầu và redeploy.

---

## Bước 4 — OAuth callback (Google / Facebook)

Vì domain đổi từ localhost → production, phải cập nhật ở console provider:

- **Google Cloud Console** → APIs & Services → Credentials → OAuth client:
  - Authorized redirect URIs: thêm `https://<APP_URL>/api/v1/auth/google/callback`
  - (Authorized JavaScript origins: thêm domain Vercel nếu cần)
  - Set biến Render: `GOOGLE_CALLBACK_URL` = URI trên.
- **Meta for Developers** → app → Facebook Login → Settings:
  - Valid OAuth Redirect URIs: `https://<APP_URL>/api/v1/auth/facebook/callback`
  - Set Render: `FACEBOOK_CALLBACK_URL` = URI trên.
- Sau OAuth, BE redirect user về `FRONTEND_URL` → đảm bảo biến này đúng domain Vercel.

---

## Bước 5 — Payment (VNPay / MoMo sandbox)

Return/IPN URL phải trỏ về Render public URL (gateway gọi ngược về):

- `VNPAY_RETURN_URL=https://<APP_URL>/api/v1/payments/vnpay/return`
- `MOMO_RETURN_URL=https://<APP_URL>/api/v1/payments/momo/return`
- `MOMO_IPN_URL=https://<APP_URL>/api/v1/payments/momo/ipn`
- VNPay IPN (`/api/v1/payments/vnpay/ipn`) cấu hình trong merchant portal VNPay sandbox nếu có.

> ⚠️ IPN phải là URL **public** (không localhost). Với Render free đang ngủ, IPN đầu tiên có thể timeout → cần keep-alive (xem đầu tài liệu).

---

## Bước 6 — Verify sau khi deploy

- [ ] `GET https://<APP_URL>/api/v1/health` → `{"status":"ok",...}` (200)
- [ ] FE load được sản phẩm (chứng tỏ FE↔BE↔DB thông, CORS OK)
- [ ] Đăng ký/đăng nhập + nhận email OTP
- [ ] Login Google/Facebook redirect đúng
- [ ] Upload ảnh sản phẩm (seller) → ảnh lên Supabase Storage, hiển thị được
- [ ] Chat/notification realtime (Socket.IO connect — check Network tab có WS 101)
- [ ] Đặt hàng COD; thử VNPay/MoMo sandbox → IPN cập nhật `payment_status`
- [ ] Swagger `/api/v1/docs` **KHÔNG** truy cập được (đã tắt ở production) — đúng như mong đợi

---

## Gotchas đã biết

| Vấn đề | Nguyên nhân | Xử lý |
|--------|-------------|-------|
| Cron/Socket im lặng | Render free spin down | Starter plan hoặc keep-alive ping `/api/v1/health` |
| `too many connections` | Pool lớn + Supabase free limited | `DB_POOL_MAX=5` (đã set), dùng pooler 5432 |
| Connect DB fail (timeout) | Dùng host direct (IPv6-only) | Đổi sang **Session pooler** host |
| CORS blocked | `CORS_ORIGIN` sai/thiếu domain Vercel | Set đúng origin, không dấu `/` cuối, redeploy |
| OAuth redirect mismatch | Callback URL còn localhost | Cập nhật ở Google/Meta console + biến env |
| Mất ảnh sau redeploy | (Đã tránh) uploads lên Supabase Storage, không ghi disk Render | — |
| Sai giờ / lệch ngày | Thiếu `TZ=UTC` | Set `TZ=UTC` trên Render |
