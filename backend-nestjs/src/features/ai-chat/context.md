# AI Chatbox (Module 21)

## Purpose
Floating storefront chatbox that helps **Guest + Customer** find products (RAG over
the catalog), answer policy FAQs, and summarize products. Conversations persist so
**Admin (Module 13)** can review history and toggle the widget on/off.

## Entities
- `ai_conversations` — one thread. Owned by `user_id` (customer) **or** `session_id`
  (guest, mirrors `carts`). `user_id` FK → users **SET NULL**. Title = first message.
- `ai_messages` — turns (`role` = `user`/`assistant`). `content` NVARCHAR(MAX).
  `product_ids` = JSON array snapshot of suggested product ids (re-render cards on
  resume/admin). FK → ai_conversations **CASCADE**.
- `ai_settings` — single row (id = 1): `chatbox_enabled` (gate), `system_prompt`
  (optional override of the built-in default).

## Endpoints
- `POST /ai/chat` — **@Public**, throttled 10/min (in-memory). Guest via `x-session-id`,
  customer via JWT. Body `{ message, conversation_id? }` → `{ conversation_id, reply, products[] }`.
- `GET /ai/config` — **@Public** → `{ enabled }` (FE gate).
- `GET /ai/conversations/:id` — **@Public**, owner-scoped resume.
- `GET /admin/ai/conversations` + `/:id` — `@Permissions(ai_chatbox:read)`.
- `GET /admin/ai/settings` (`ai_chatbox:read`) · `PATCH /admin/ai/settings` (`ai_chatbox:update`).

## Design decisions
- **Single LLM call per message** (retrieve-then-generate). Retrieval = raw message
  as `ProductService.findActiveProducts({ search, price hints })` — no extra LLM call.
  Products fed into the system prompt as a compact context block; the prompt forbids
  recommending anything outside that list (no hallucinated products).
- **Provider:** reuses the OpenRouter key/baseUrl from Visual Search; only the model
  differs (`OPENROUTER_CHAT_MODEL`, a Grok text model). Util mirrors
  `grok-visual-search.util.ts` (native `fetch`, no SDK).
- **Graceful fallback:** LLM/provider error → polite fallback reply (HTTP 200, still
  persisted). Missing API key → `CHATBOT_004 (503)`.
- **No Redis:** throttle is in-memory (repo has no Redis — see `share-docs/TECH_DEBT.md`
  TD-001). The `ai_settings` toggle is read from DB per request (light single-row query).

## Error codes
`CHATBOT_001` 404 conversation not found · `CHATBOT_002` 400 message empty/too long ·
`CHATBOT_003` 403 not owner · `CHATBOT_004` 503 AI not configured · `CHATBOT_005` 400
chatbox disabled. (Runtime provider errors → fallback 200, not an error code.)

## Dependencies
Imports `ProductModule` (RAG retrieval + hydration via `findActiveProducts` /
`findActiveByIds`). Registered in `app.module.ts`. Seed: `ai-chat.seed.ts` (order 12).

## Verify
Run full `npm run seed` (cleanTables wipes all tables regardless of `--feature`, and
`ai_chatbox:*` permission is granted only when `AuthSeed` runs). Set
`OPENROUTER_CHAT_MODEL` in `.env`.
