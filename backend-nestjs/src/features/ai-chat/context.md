# AI Chatbox → AI Shopping Agent (Module 21)

## Purpose
Floating storefront assistant for **Guest + Customer**. Beyond RAG suggestions +
policy FAQ, it is a **tool-calling agent** that acts on the shopper's behalf:
search, add/update/remove cart, look up & cancel (pending) orders, list addresses,
and **propose checkout**. Conversations persist so **Admin (Module 13)** can review
history (including the agent's actions) and toggle the widget on/off.

## Agent tool loop (`tools/`)
- `tools/agent-tools.ts` — OpenAI/OpenRouter `tools[]` definitions + static `POLICY_FAQ`.
- `tools/tool-dispatcher.ts` — `@Injectable() ToolDispatcher.run(name, args, owner)`
  maps each tool to a real service (`ProductService`/`CartService`/`OrderService`/
  `UserProfileService`/`CouponService`). **Owner comes from the request, never from tool
  args.** Guest-gated tools (checkout/order/address/**coupons**) → `{ needs_login }`.
  Service errors are caught → `{ error: { code, message } }` (uses `return await` so
  rejections are caught, never thrown out of the loop).
- **Variant safety (`add_to_cart`):** the prompt forbids guessing an unspecified variant
  axis — the agent must confirm **every** option (e.g. colour AND size) and only call
  `add_to_cart` with the exact `product_variant_id`, else ask which value is missing.
- **Language + cross-language search:** the reply must match the user's language
  (English question → English answer). The catalog is Vietnamese, so the keyword seed
  (`retrieveProducts` → `extractKeywords`) misses English terms; the prompt tells the model
  to **translate the need to Vietnamese keywords and call `search_products`** when the seed
  block is empty, instead of prematurely answering "not found".
- **Coupons (`list_coupons`):** reads `CouponService.getAvailableCouponsForCart(userId)`
  (customer-only → `needs_login` for guests) so the agent can surface vouchers and pass
  chosen codes into `propose_checkout.coupon_codes`. The prompt tells it to proactively
  offer eligible vouchers before checkout.
- **Quick-reply chips (`ask_choice`):** a no-side-effect, guest-safe tool
  `ask_choice({ question, options[] })` → `quick_replies` action. Each option is a
  complete message the customer sends on tap. The prompt tells the model to use it for a
  missing variant axis (colour/size) or to pick a coupon, so the shopper doesn't type.
- **Suggested-product selection (`selectSuggestedProducts`):** the displayed cards are
  the agent's own `search_products` results first, then keyword-seed products **filtered
  to the dominant category** — so a fashion chat can't leak a phone. `retrieveProducts`
  now returns `[]` when no product keyword survives (a greeting or a follow-up like
  "size M đi" — variant/filler words are stopwords), instead of LIKE-matching the raw
  sentence. So a pure clarification turn shows no new cards.
- `AiChatService.runAgentLoop` — bounded loop (`MAX_TOOL_ROUNDS = 4`). Model returns
  `tool_calls` → dispatch → feed `role:'tool'` results back → loop; plain content
  ends it. Identical tool calls are de-duplicated (no double add-to-cart). A provider
  error/429 mid-loop breaks with the graceful fallback, keeping actions already done.
- **Money gate:** `propose_checkout` calls `OrderService.previewCheckout` (advisory,
  no writes) → `checkout_proposal` action. Placing the order is the **frontend**
  mini-checkout calling the existing `POST /orders` — the LLM never charges money.
- `actions[]` (`cart_updated`/`checkout_proposal`/`order_cancelled`/`needs_login`/
  `quick_replies`) are returned to the FE and snapshotted into `ai_messages.actions` (JSON).

## Entities
- `ai_conversations` — one thread. Owned by `user_id` (customer) **or** `session_id`
  (guest, mirrors `carts`). `user_id` FK → users **SET NULL**. Title = first message.
- `ai_messages` — turns (`role` = `user`/`assistant`). `content` NVARCHAR(MAX).
  `product_ids` = JSON array snapshot of suggested product ids (re-render cards on
  resume/admin). `actions` NVARCHAR(MAX) = JSON snapshot of agent action cards
  (migration `1756800000000-AddActionsToAiMessages`; dev auto-adds via synchronize).
  FK → ai_conversations **CASCADE**.
- `ai_settings` — single row (id = 1): `chatbox_enabled` (gate), `system_prompt`
  (optional override of the built-in default).

## Endpoints
- `POST /ai/chat` — **@Public**, throttled 10/min (in-memory). Guest via `x-session-id`,
  customer via JWT. Body `{ message, conversation_id? }` → `{ conversation_id, reply,
  products[], actions?[] }`.
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
Imports `ProductModule`, `CartModule`, `OrderModule`, `UserProfileModule`, `CouponModule`
(agent tools reuse their **services** — no repos/entities touched). One-way import (only
`AppModule` imports `AiChatModule`) → no circular dep. Seed: `ai-chat.seed.ts` (order 12).

## Verify
Run full `npm run seed` (cleanTables wipes all tables regardless of `--feature`, and
`ai_chatbox:*` permission is granted only when `AuthSeed` runs). Set
`OPENROUTER_AGENT_MODEL` (tool-capable) in `.env` for the agent; else it falls back to
`OPENROUTER_CHAT_MODEL` and self-degrades to plain RAG.
