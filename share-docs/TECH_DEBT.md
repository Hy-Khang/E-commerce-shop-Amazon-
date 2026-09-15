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

---

## TD-002 — Module 22 (Smart Recommendations): cải tiến chất lượng gợi ý

- **Ngày ghi nhận:** 2026-09-11
- **Trạng thái:** ✅ TASK-1 + TASK-2 + TASK-4 (ranking quality A+B) ĐÃ LÀM (2026-09-11);
  ⏸️ TASK-3 + TASK-5 (cache) DEFERRED
- **Mức độ:** Thấp (v1 đã đạt đủ tiêu chí đề tài; các mục dưới là điểm cộng trải nghiệm)
- **Khu vực:** `backend-nestjs/src/features/recommendations/`, tích hợp `product` + `Module 21 (AI Chatbox)`

### Bối cảnh
Module 22 v1 dùng content-based scoring on-demand (category ×N / price / shop), reason label
rule-based, hydrate qua `ProductService.findActiveByIdsWithStats`. Đã verify e2e đạt đủ tiêu chí
`PROJECT_MODULES.md` §Module 22. Ba khoản dưới **cố ý để lại** để không mở scope commit gốc.

### Task cải tiến

**TASK-1 — Đưa SEARCH signal vào scoring (keyword → category bias)** — ✅ DONE (2026-09-11)
- Repo `getSearchedCategories(owner)`: `JSON_VALUE(metadata,'$.keyword')` match `products.name`
  bằng `LIKE`, group theo `category_id`, đếm `COUNT(DISTINCT ual.id)` (mỗi search cộng 1 điểm cho
  category chạm tới). Keyword là **data trong SQL** (không nối chuỗi → không injection); metadata
  hỏng/thiếu key → `JSON_VALUE` NULL → drop (lenient).
- `buildProfile` cộng vào `categoryWeights` với `SEARCH_CATEGORY_WEIGHT=1` (nhẹ hơn VIEW). Guest chỉ
  search cũng **thoát cold-start** và được bias đúng category (verify live: search "áo thun" → gợi ý
  áo thun + reason). Không thêm bảng, không đổi API/DTO/schema.

**TASK-2 — AI diễn giải reason (OpenRouter, opt-in)** — ✅ DONE (2026-09-11)
- `RecommendationReasonService`: gate bằng env `RECOMMENDATIONS_AI_REASON` (**mặc định false**), tái
  dùng key/model của AI Chatbox (`chatbot.apiKey/baseUrl/chatModel`). Gọi 1 lần OpenRouter (timeout
  4s, `AbortController`), cache in-memory theo `categoryId` (TTL 6h). **Fallback ngay** về rule-based
  `"Because you like {category}"` khi: flag off / thiếu key / HTTP lỗi / timeout / response rỗng.
  Contract response giữ nguyên (`reason: string|null`); mặc định off nên không thêm latency/cost.
- Khi bật + có Redis (TD-001) có thể chuyển cache category→reason sang Redis để chia sẻ đa-instance.

**TASK-3 — (nice-to-have) Throttle `POST /activity` chống log spam** — ⏸️ DEFERRED
- Hiện trạng: `POST /activity` `@Public`, lenient, không rate-limit (chủ ý v1 — analytics signal).
- Hướng làm: thêm `@Throttle` riêng cho route (in-memory hiện tại, hoặc Redis store sau TD-001)
  nếu xuất hiện spam log. Chưa cần khi quy mô đồ án.

**TASK-4 — Nâng chất lượng ranking (Tầng A + B)** — ✅ DONE (2026-09-11)
- **Weighted category** (`scoreCandidates`): thay `+3` nhị phân bằng `3 × categoryWeight/maxWeight`
  (dùng đúng profile vector; category dominant full 3, yếu hơn tỉ lệ). Div-guard `max(1,…)`.
- **Tiebreak** đồng điểm theo best-seller rank (SP ngoài pool → cuối). Best-seller pool fetch **1 lần**
  sau cold-start guard, dùng chung cho cả tiebreak + top-up (refactor `getFallbackIds` nhận preloaded).
- **Percentile price** 10–90 thay raw min/max (chống outlier phình range → `+2` không còn "cho không").
- **Recency decay** `0.5^(ageDays/30)` cho tín hiệu per-row (`getInteractedProducts` thêm `created_at`;
  `InteractedProduct.createdAt?` optional). *Giới hạn:* viewed/searched categories là aggregate → không decay.
- **Co-view/co-purchase**: `HAVING COUNT(*) >= 2` (min-support, bỏ nhiễu cnt=1); co-view thêm dampen
  popularity `count/SQRT(pop)`, co-purchase **không** dampen (phụ kiện phổ biến đáng hiện; heuristic
  không phải lift thật). Min keyword length SEARCH nâng lên 3.
- Không đổi schema/contract/DTO/FE. `tsc` sạch, 28 test recommendations pass. Docs (context.md,
  API_SPEC §Scoring, PROJECT_MODULES §Module 22) cập nhật cho khớp.

**TASK-5 — (nice-to-have) Cache scoring per-owner** — ⏸️ DEFERRED
- Hiện trạng: mỗi `GET /recommendations` chạy lại full profile + scoring queries on-demand.
- Hướng làm: in-memory `Map<ownerKey,{result,exp}>` TTL ~10' (mirror cache của `RecommendationReasonService`).
  Hoãn: single-instance chưa cần; khi làm TD-001 chuyển thẳng sang Redis-backed cache (chia sẻ đa-instance).

### Ghi chú
- Các task **không đổi schema `user_activity_log`** và **không đổi contract 4 endpoint** hiện có
  → có thể làm dần từng task ở commit riêng, không block nhau.
- TASK-2 phụ thuộc mềm Module 21 (OpenRouter đã có sẵn client) và hưởng lợi TD-001 (cache scoring).
- TASK-5 hưởng lợi trực tiếp TD-001 (đổi Map → Redis khi scale-out).

---

## TD-SUPABASE — Migrate SQL Server → Supabase (Postgres) + Supabase Storage — ✅ DONE (code), ⏸️ follow-ups

Driver swap `mssql`→`pg`, entity column types + raw SQL ported to Postgres, error codes
(`23505`/`23503` via `common/utils/db-error.util.ts`), image storage moved to Supabase Storage
(`core/storage`). Data moved by `scripts/migrate-mssql-to-pg.ts` (`npm run migrate:etl -- --with-files`).

**Follow-ups (not blocking):**
- **Accent-insensitive search** — `ILIKE` is case-insensitive but **accent-sensitive** (SQL Server's
  collation may have been accent-insensitive). If "ao" must match "áo", enable the `unaccent` extension
  and switch search predicates to `unaccent(col) ILIKE unaccent(:q)` (or use `citext`). Deferred until the
  live collation behaviour is confirmed.
- **Seed image URLs** — the dev seeds still write `/uploads/products/*` paths. With static serving removed,
  fresh-seeded dev shows broken images (real prod data is rewritten to Supabase URLs by the ETL). Point the
  seeds at the uploaded bucket URLs or an external placeholder if fresh-dev images matter.
- **Remove `mssql` driver** — kept installed for the one-time ETL (needs both drivers). Remove from
  `package.json` after the migration is verified.
- **`session_replication_role`** — the ETL tries to disable FK checks during load; the Supabase `postgres`
  role may lack the privilege, in which case it relies on the parent-first insert order (works for the
  current schema, incl. self-referencing `categories`).
- **`app.uploadDir`** config + `NestExpressApplication` static serving are now unused (kept harmless).
