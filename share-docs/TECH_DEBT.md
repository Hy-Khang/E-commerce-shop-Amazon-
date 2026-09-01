# TECH DEBT — Cải tiến hạ tầng/kiến trúc hoãn có chủ đích

> File tổng hợp các khoản **nợ kỹ thuật** (infra/kiến trúc) **cố ý chưa làm** để không
> mở rộng scope task đang chạy. Khác với `KNOWN_ISSUES.md` (bug/khiếm khuyết) — ở đây là
> những thứ **đang chạy đúng** bằng giải pháp thay thế, nhưng nên nâng cấp về sau bằng một
> PR hạ tầng riêng. Mỗi mục ghi rõ hiện trạng + hướng làm để lần sau xử lý nhanh.

---

## TD-001 — Redis chưa được triển khai; toàn dự án dùng in-memory thay thế

- **Ngày ghi nhận:** 2026-08-31
- **Trạng thái:** ⏸️ DEFERRED (chủ động hoãn — không block feature nào)
- **Mức độ:** Thấp (ở quy mô đồ án in-memory chạy tốt; chỉ hụt khi scale-out nhiều instance)
- **Khu vực:** hạ tầng dùng chung — `throttler`, `auth` (permission cache), `notification` (unread count), `flash-sale`, các module có rate-limit/cache (vd Module 21 AI Chatbox)

### Bối cảnh
Tài liệu (`PROJECT_MODULES.md`, bảng Tech Stack + các note "**Redis cache** (dự kiến)")
mô tả Redis là store cho: permission cache per role, Flash Sale khung giờ cao điểm,
notification unread count, recommendation scoring, và `@nestjs/throttler` store cho AI Chatbox.

**Nhưng code thực tế chưa dựng Redis** — và điều này **nhất quán toàn dự án**, không phải
thiếu sót riêng lẻ.

### Hiện trạng đã xác minh (2026-08-31)
| Thành phần | Thực tế trong repo |
|---|---|
| `ioredis` / `cache-manager` / `@nestjs/cache-manager` | **Không có** trong `backend-nestjs/package.json` |
| Biến env Redis (`REDIS_*`) | **Không có** trong `.env.example` |
| Throttler | `@nestjs/throttler@^6.5.0` đã cài; `ThrottlerModule.forRoot([{ ttl:60000, limit:10 }])` tại `src/app.module.ts:36` — **default in-memory store** |
| Permission cache | `Map<roleId, Set<string>>` TTL 60s; `src/features/auth/context.md:69` ghi rõ *"abstract interface for future Redis swap"* |

→ Mọi chỗ "cần Redis" đều đang dùng **in-memory tương đương** và chạy đúng.

### Vì sao hoãn (không nhét Redis lẻ vào từng feature)
- Nhất quán pattern hiện có (throttler + permission cache đều in-memory).
- Thêm Redis cho **1 module** kéo theo cả mảng hạ tầng: cài package, chạy Redis server,
  thêm env, wiring `CacheModule` / `ThrottlerStorageRedis`, xử lý fallback khi Redis down.
  Đó là scope hạ tầng riêng, không thuộc bất kỳ feature đơn lẻ nào.
- Quy mô đồ án (single instance) chưa cần Redis để đúng chức năng.

### Hướng làm (khi xử lý — nên gộp 1 PR hạ tầng chung)
1. Cài `ioredis` (+ `@nestjs/cache-manager` nếu muốn cache generic) + `@nest-lab/throttler-storage-redis` (hoặc tương đương) cho throttler store.
2. Thêm `REDIS_HOST/PORT/PASSWORD/DB` vào `.env.example` + Joi trong `src/config/config.module.ts`.
3. **Swap đồng loạt qua interface có sẵn**, KHÔNG viết lẻ:
   - `throttler` → Redis storage (bật đa-instance rate-limit đúng).
   - permission cache → thay `Map` bằng Redis-backed (interface "future Redis swap" đã dựng sẵn ở `auth`).
   - notification unread count, flash-sale price map, recommendation scoring → cache Redis theo TTL.
4. **Fallback graceful**: Redis không kết nối được → degrade về in-memory (không làm chết request).

### Ghi chú
- Xử lý ở **PR/commit riêng thuộc scope hạ tầng**, không trộn vào feature.
- **Không block Module 21 (AI Chatbox):** module này chạy throttler in-memory (10 req/phút)
  + toggle `ai_settings` đọc DB (cache in-memory nhẹ tùy chọn) — đúng hiện trạng repo. Khi
  làm TD-001 thì AI Chatbox tự hưởng lợi qua Redis throttler store mà không phải sửa gì.
