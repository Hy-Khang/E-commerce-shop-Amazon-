# Kế hoạch: Module 21 — AI Chatbox (0% → hoàn thành)

## Context

`share-docs/PROJECT_STATUS.md` đang ghi **Module 21: AI Chatbox — 0% ❌** ("Không có Grok API integration, không có chatbox widget, không có endpoint POST /ai/chat"). Đây là 1 trong 4 module còn 0% (cùng 16 Order Tracking, 19 Product Comparison, 22 Smart Recommendations); tổng tiến độ hiện ~81% (17/22).

Mục tiêu: xây dựng **chatbox AI nổi (floating) ở góc phải dưới storefront** cho **Guest + Customer**, hỗ trợ (1) gợi ý sản phẩm bằng ngôn ngữ tự nhiên qua **RAG** (query DB → đưa vào context), (2) trả lời **FAQ** chính sách (đổi trả/vận chuyển/thanh toán/coupon), (3) tóm tắt sản phẩm. Hội thoại **lưu DB** để **Admin (Module 13)** xem lịch sử + **bật/tắt** chatbox. Rate-limit qua `@nestjs/throttler` (in-memory — repo chưa có Redis).

### Quyết định đã chốt với user
- **Lưu trữ:** Persist DB (`ai_conversations` + `ai_messages`) + làm luôn phần **Admin** (xem lịch sử + toggle bật/tắt).
- **Provider:** **Tái dùng OpenRouter** đã có sẵn config + API key đang hoạt động (`src/config/grok.config.ts` namespace `visualSearch`, dùng cho Visual Search). Thêm config chat riêng, chọn model text (đề xuất một model **Grok trên OpenRouter** để vừa đúng chữ "Grok" trong tài liệu vừa dùng lại key OpenRouter).
- **Truy cập:** `@Public()` — Guest (qua `x-session-id`) + Customer (qua JWT).

### Pattern tái sử dụng (đã khảo sát)
- LLM call mẫu: [grok-visual-search.util.ts](backend-nestjs/src/features/product/utils/grok-visual-search.util.ts) — native `fetch` tới `{baseUrl}/chat/completions`, `Bearer {apiKey}`, parse JSON có fallback. **Mirror pattern này** cho chat (không cài SDK, không axios).
- Config mẫu: [grok.config.ts](backend-nestjs/src/config/grok.config.ts) + Joi trong [config.module.ts](backend-nestjs/src/config/config.module.ts) (dòng 58–61).
- RAG retrieval: `ProductService.findActiveProducts(query)` và `findActiveByIds(ids)` trong [product.service.ts](backend-nestjs/src/features/product/product.service.ts) — import `ProductModule`, inject `ProductService` (không đụng repository trực tiếp).
- Cấu trúc feature mẫu: `src/features/chat/` (Module 20) — module/controller/service/dto/entities/repositories/tests/context.md.
- Throttle mẫu: [product.controller.ts](backend-nestjs/src/features/product/product.controller.ts) dòng ~81 (`@UseGuards(ThrottlerGuard)` + `@Throttle`).
- FE: mirror `MessageThread`/`MessageInput` (auto-scroll, Enter-to-send) trong `features/chat/components/`; reuse `ProductCard` từ `@/features/product`; Zustand `persist` mẫu `features/recently-viewed/stores/recently-viewed.store.ts`; mount widget ở [MainLayout.tsx](frontend-react/src/core/layouts/MainLayout.tsx); axios `@/core/api/axios-instance`.

---

## Backend — feature mới `src/features/ai-chat/`

Đăng ký module trong [app.module.ts](backend-nestjs/src/app.module.ts) `imports[]`. Import `ProductModule` (RAG). `TypeOrmModule.forFeature([AiConversation, AiMessage, AiSetting])`. Thêm `context.md`.

### Entities & bảng mới (DATABASE.md convention: snake_case, NVARCHAR, DATETIME2 + SYSUTCDATETIME(), BIT)
1. **`ai_conversations`** — `id` PK; `user_id` INT FK→users NULL (Customer); `session_id` NVARCHAR(100) NULL (Guest, giống `carts`); `title` NVARCHAR(255) NULL (tóm tắt câu đầu); `created_at`, `updated_at`. Index `idx_ai_conversations_user_id`, `idx_ai_conversations_session_id`.
2. **`ai_messages`** — `id` PK; `conversation_id` FK→ai_conversations ON DELETE CASCADE NOT NULL; `role` NVARCHAR(20) (`user`/`assistant`); `content` NVARCHAR(MAX) NOT NULL; `product_ids` NVARCHAR(MAX) NULL (JSON mảng id SP gợi ý để render lại card); `created_at`. Index `idx_ai_messages_conversation_created (conversation_id, created_at)`.
3. **`ai_settings`** — bảng 1 dòng: `id` PK; `chatbox_enabled` BIT DEFAULT 1; `system_prompt` NVARCHAR(MAX) NULL (override prompt mặc định); `updated_at`. Seed sẵn 1 row.

> Dev đang `DB_SYNCHRONIZE=true` (schema tự apply lúc boot — xem memory). Vẫn viết 1 migration `...-CreateAiChatTables.ts` trong `core/database/migrations/` cho đúng rule prod.

### Repositories (mỗi entity 1 lớp `@Injectable()`)
`ai-conversation.repository.ts`, `ai-message.repository.ts`, `ai-setting.repository.ts`.

### Config
- `src/config/chatbot.config.ts` → `registerAs('chatbot', () => ({ apiKey: OPENROUTER_API_KEY, baseUrl: OPENROUTER_BASE_URL, chatModel: OPENROUTER_CHAT_MODEL || 'x-ai/grok-4-fast:free' }))` (dùng lại key OpenRouter, model chat riêng).
- Thêm `OPENROUTER_CHAT_MODEL` (optional, default) vào Joi trong `config.module.ts` + import config.
- Thêm `OPENROUTER_CHAT_MODEL=` vào `.env.example`.

### Util `utils/ai-chat.util.ts` (mirror grok-visual-search)
- `callChatCompletion(messages, config)` — `fetch` text-only chat completion, `response.ok` guard, trả `choices[0].message.content`, throw khi lỗi (service bắt để fallback).
- `SYSTEM_PROMPT` mặc định: mô tả sàn + chính sách (đổi trả/vận chuyển/thanh toán COD·VNPay·MoMo/coupon) + hướng dẫn chỉ gợi ý SP có trong context (không bịa SP).
- (tùy chọn / nâng cao) `parsePriceHint(message)` — regex bắt "dưới 300k / 200-500k" để set `max_price`/`min_price`.

### Service `ai-chat.service.ts` — `chat(dto, owner)` (RAG 1 lần gọi LLM)
1. Validate message (≤2000, không rỗng → `CHATBOT_002`). Resolve owner: `{ userId }` nếu có `@CurrentUser`, else `{ sessionId }` từ header (mirror `resolveCartOwner`). Load/tạo conversation, kiểm ownership → `CHATBOT_003`.
2. Check `ai_settings.chatbox_enabled` → nếu tắt trả `CHATBOT_005`.
3. Load ~10 tin nhắn gần nhất của conversation làm history (giới hạn token).
4. **Retrieval (không tốn thêm call LLM):** dùng **raw message làm `search`** (+ `parsePriceHint` nếu có) gọi `productService.findActiveProducts({ search, min_price?, max_price?, limit: 6 })` → lấy `result.data` (kiểu `IPaginatedResult<Product>`) → map context gọn (id, name, price range, category, shop, slug). *(Nâng cao sau này: 1 call LLM extract intent để lọc tốt hơn — không làm ở bản đầu để giảm latency/chi phí/điểm lỗi.)*
5. **Generation:** `callChatCompletion([system + productContext, ...history, userMessage])` → reply text (1 lần gọi LLM duy nhất).
6. Persist `user` + `assistant` message (kèm `product_ids` từ SP retrieval). Hydrate SP gợi ý qua `findActiveByIds` → trả `ProductListItem[]` (reorder theo thứ tự retrieval vì `findActiveByIds` không đảm bảo order).
7. **Fallback:** lỗi gọi LLM (provider/timeout) → trả reply nhã nhặn "AI tạm không khả dụng, vui lòng liên hệ seller" (HTTP 200, vẫn persist). Thiếu API key (config) → `CHATBOT_004`.

### Controller `ai-chat.controller.ts` (`@Controller('ai')`, Swagger tags)
- `POST /api/v1/ai/chat` — `@Public()`, `@UseGuards(ThrottlerGuard)` + `@Throttle({ default: { ttl: 60000, limit: 10 } })`. Body `{ message: string(≤2000), conversation_id?: number }`. Trả `{ conversation_id, reply, products: ProductListItem[] }`.
- `GET /api/v1/ai/config` — `@Public()` → `{ enabled }` (FE ẩn/hiện widget).
- `GET /api/v1/ai/conversations/:id` — trả messages (own theo user_id/session_id) để resume.

### Admin (Module 13) — controller `admin-ai-chat.controller.ts` (`@Controller('admin/ai')`)
- `GET /admin/ai/conversations` (paginated) · `GET /admin/ai/conversations/:id` (messages) — `@Permissions(AI_CHATBOX_READ)`.
- `GET /admin/ai/settings` · `PATCH /admin/ai/settings` (`{ chatbox_enabled, system_prompt? }`) — `@Permissions(AI_CHATBOX_UPDATE)`.

### Permissions & error codes
- Thêm `AI_CHATBOX_READ='ai_chatbox:read'`, `AI_CHATBOX_UPDATE='ai_chatbox:update'` vào [permissions.constant.ts](backend-nestjs/src/common/constants/permissions.constant.ts). `ALL_PERMISSIONS = Object.values(PERMISSIONS)` nên admin (được gán ALL) tự có — **nhưng cần chèn 2 permission này + gán cho role admin trong `AuthSeed`** ([auth.seed.ts](backend-nestjs/src/core/database/seeds/)) và re-seed để ghi `permissions` + `role_permissions` (dev `synchronize` không tự thêm row seed).
- Error codes (throw inline `{ code, message }` như CHAT_xxx): `CHATBOT_001` 404 conversation not found, `CHATBOT_002` 400 message empty/>2000, `CHATBOT_003` 403 not owner, `CHATBOT_004` 503 AI not configured (thiếu key), `CHATBOT_005` 400 chatbox disabled. *(Lỗi provider lúc chạy → fallback 200, không phải error code.)*

### Seed `core/database/seeds/ai-chat.seed.ts` (implements `ISeed`: `name`, `order`, `run`)
Row `ai_settings` (enabled=1) + vài `ai_conversations`/`ai_messages` mẫu để Admin demo. Đăng ký `AiChatSeed` vào `ALL_SEEDS` trong [seed-runner.ts](backend-nestjs/src/core/database/seed-runner.ts) và thêm `'ai_messages'`, `'ai_conversations'`, `'ai_settings'` vào `DELETE_ORDER` (children-first, đặt trên nhóm shops/users).
> ⚠️ **Gotcha:** `cleanTables()` xóa **toàn bộ** bảng trong `DELETE_ORDER` bất kể `--feature=`. Vì vậy để verify phải chạy **`npm run seed`** (full) — không dùng `--feature=ai-chat` một mình (sẽ wipe data feature khác). Permission admin cũng chỉ được cấp khi `AuthSeed` chạy.

---

## Frontend — feature mới `src/features/ai-chat/`

Layout chuẩn: `pages/ components/ hooks/ services/ stores/ types/ index.ts context.md`. Export chỉ qua barrel. Style token storefront (`bg-brand`, `text-text-primary`, `.shop-input`, `rounded-xl`), icon `lucide-react` — theo `docs/DESIGN.md`.

- **services/ai-chat.service.ts** — `sendMessage({message, conversation_id})`, `getConfig()`, `getConversation(id)` qua `@/core/api/axios-instance`.
- **hooks/useAiChat.ts** — `aiChatKeys` factory; `useAiConfig()` (`useQuery`, gate widget); `useSendAiMessage()` (`useMutation`, optimistic append user msg + temp id, `onSuccess` append reply + products, `meta.suppressToast`, `onError` rollback) — **không cần socket**.
- **stores/ai-chat.store.ts** — Zustand `persist` (key `ai_chat`) giữ `{ messages[], conversationId, isOpen }`, trim `MAX_MESSAGES` (mirror recently-viewed store) → hội thoại sống qua reload trong phiên.
- **components/** — `AiChatWidget` (FAB + panel toggle, gate bằng `useAiConfig`), `AiChatPanel`, `AiMessageList` (auto-scroll, mirror `MessageThread`), `AiMessageBubble`, `AiChatInput` (mirror `MessageInput`), `AiProductSuggestions` (render `ProductCard` từ `@/features/product`). Co-locate `*.test.tsx`.
- **Mount:** `<AiChatWidget />` trong [MainLayout.tsx](frontend-react/src/core/layouts/MainLayout.tsx) sau `<Footer/>`; z-index ~`z-60`, lệch vị trí tránh đè toast Sonner (bottom-right).

### Admin FE (Module 13)
Trang admin đặt trong chính feature: `features/ai-chat/pages/AdminAiConversationListPage.tsx`, `AdminAiConversationDetailPage.tsx`, `AdminAiSettingsPage.tsx` (mirror `AdminReviewListPage`/`AdminCouponListPage`).
- Route lazy `admin/ai-conversations`, `admin/ai-conversations/:id`, `admin/ai-settings` thêm vào block `AdminLayout` trong [router.tsx](frontend-react/src/core/router/router.tsx). **Guard dùng `PortalGuard requiredPermission={PERMISSIONS.PORTAL_ADMIN}`** như mọi route admin khác (không phải `ai_chatbox:*` — quyền đó chỉ gate ở API backend; admin có sẵn cả hai).
- Thêm hằng route vào [routes.ts](frontend-react/src/common/constants/routes.ts) + link vào sidebar `AdminLayout`.

---

## Cập nhật tài liệu (share-docs)
- **PROJECT_STATUS.md** — sửa dòng `> Cập nhật:` (2026-08-31); row 21 → % BE/FE/Tổng; chuyển 21 khỏi bucket 0%; viết lại block `#### Module 21: AI Chatbox — 100% ✅`; cập nhật dòng ưu tiên + dòng packages (đổi "cần API key" thành đã dùng OpenRouter). Giữ tiếng Việt, đúng format hiện có.
- **API_SPEC.md** — thêm mục "AI Chatbox — `/api/v1/ai`" (customer/public) + "Admin: AI Chatbox — `/api/v1/admin/ai`" + các mã `CHATBOT_00x` vào bảng §5.
- **DATABASE.md** — thêm entity `ai_conversations`, `ai_messages`, `ai_settings` + index + node ERD.

---

## Tests (skill `/be-test`, `/fe-test`)
- BE: `ai-chat.service.spec.ts` (RAG retrieval gọi ProductService, fallback khi LLM lỗi, ownership guard, chatbox disabled), `ai-chat.controller.spec.ts`, admin controller spec. Mock `fetch`/util.
- FE: hook `useSendAiMessage` (optimistic + rollback), `useAiConfig` gate; component `AiChatWidget`/`AiProductSuggestions`.

## Verification (end-to-end)
1. BE: thêm `OPENROUTER_CHAT_MODEL` vào `.env`, chạy **`npm run seed`** (full — không dùng `--feature=` vì clean toàn bộ, và cần AuthSeed cấp permission), chạy backend; mở Swagger `/api/v1/docs`.
2. `POST /ai/chat` với "Tôi cần áo thun nam đen dưới 300k" → kiểm reply + `products[]`; test FAQ "chính sách đổi trả?"; test `conversation_id` để nối hội thoại; test rate-limit (>10 req/phút → 429).
3. `GET /ai/config` → `{enabled:true}`; `PATCH /admin/ai/settings` tắt → `POST /ai/chat` trả `CHATBOT_005`, widget FE ẩn.
4. FE (skill `/run`): mở storefront → widget nổi góc phải, chat ra card SP click được; đăng nhập Admin → xem lịch sử hội thoại + toggle. Chụp screenshot widget + panel.
5. Guest (không login, có `x-session-id`) chat được và hội thoại lưu DB.

## Ghi chú / rủi ro (đã xác minh với code thật)
- Model chat OpenRouter free có thể rate-limit/độ trễ — throttle 10/phút + fallback đã xử lý. Chỉ **1 call LLM/tin nhắn** (retrieve-then-generate) để giảm chi phí/độ trễ.
- Guest persist: axios interceptor **đã tự gắn `x-session-id`** khi chưa đăng nhập (`axios-instance.ts` dòng 17–26) → backend đọc qua `@Headers('x-session-id')` như cart. Không cần thêm gì FE.
- `findActiveProducts` trả `IPaginatedResult<Product>` → dùng `.data`; `findActiveByIds` không đảm bảo thứ tự → reorder theo id retrieval.
- Không có Redis → throttler in-memory (đúng hiện trạng repo); toggle `ai_settings` đọc từ DB (có thể cache in-memory nhẹ).
- Migration viết sẵn nhưng dev `DB_SYNCHRONIZE=true` sẽ auto-tạo bảng lúc boot (memory) — chạy app trước rồi seed.
