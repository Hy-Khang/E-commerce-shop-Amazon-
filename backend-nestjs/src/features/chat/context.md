# Chat Feature (Module 20 — Chat Realtime)

## Purpose
Two-way realtime chat between a **Customer** and a **Seller** (shop). Text
messages, conversation list, unread badge, mark-as-read, plus **typing
indicators, online presence, and read receipts** (`sent → delivered → read`).

## Entities
- **`conversations`** — one row per `(customer_id, shop_id)` pair (UNIQUE).
  Holds denormalized `last_message_at` / `last_message_preview` for the list and
  two per-side counters `customer_unread` / `seller_unread`.
- **`messages`** — `conversation_id`, `sender_id`, `sender_type`
  (`customer`/`seller`, derived server-side — never trusted from the client),
  `content` (NVARCHAR 2000), `status` (`sent`/`delivered`/`read`).

## Dependencies
- **ShopModule** (DI) — membership resolution. A caller is the **customer** side
  when `conversation.customer_id === userId`; the **seller** side when they own
  `conversation.shop_id` (`ShopService.findShopByUserIdOrNull` — non-throwing).
  No new RBAC permission: `/chat/*` is a shared authenticated resource, access
  gated by membership (`CHAT_002`).
- **JwtModule** — the gateway verifies the WS handshake token itself.

## Realtime — ChatGateway
Shares the **default namespace `/`** with `NotificationGateway` (one shared
client socket) but runs its **own** `handleConnection` JWT verify (both gateways
fire per socket — depending on ordering would be a race). Rooms: `user:{id}`
(personal, for badges) and `conversation:{id}` (per thread).

In-memory maps: `onlineCount` (userId → live socket count, multi-tab safe),
`socketConversations` (socketId → joined conv ids), `conversationUsers`
(convId → userId → socket count in that room).

**Persist-then-emit:** REST persists the message, then the gateway emits. The
initial receipt status is resolved from the recipient's live presence:
in the conversation room ⇒ `read`; merely online ⇒ `delivered`; else `sent`.
`PATCH .../read` promotes the counterpart's messages to `read` and emits
`chat:read`.

Socket events (see `types/chat.types.ts` `CHAT_EVENTS`):
- `chat:new_message` (server→room + recipient user room) — a `MessageResponseDto`
- `chat:read` (server) — `{ conversationId, status }`
- `chat:typing` (client↔server) — `{ conversationId, userId, isTyping }`
- `chat:presence` (server) — `{ conversationId, userId, online }`
- `chat:join` / `chat:leave` (client→server) — `{ conversationId }`, membership-checked

## REST — `/api/v1/chat` (JWT auth only)
- `POST /chat/conversations` `{ shop_id }` — customer starts/gets (idempotent)
- `GET /chat/conversations` — list (both sides; unread + counterpart per side)
- `GET /chat/conversations/:id/messages` — paginated (newest first)
- `POST /chat/conversations/:id/messages` `{ content }` — send
- `PATCH /chat/conversations/:id/read` — reset unread + emit receipts (204)
- `GET /chat/unread-count` — total unread for the header badge

## Error codes
- `CHAT_001` (404) conversation not found
- `CHAT_002` (403) not a participant
- `CHAT_003` (400) cannot chat with your own shop
- `CHAT_004` (400) empty/too-long message *(enforced by `SendMessageDto`)*

## Design decisions
- **Unread is chat-owned**, independent of `notifications` — no `notifications`
  rows are created for chat. The badge's cold load uses `GET /chat/unread-count`.
- **`messages.sender_id` FK is NO ACTION** (not CASCADE): SQL Server forbids
  multiple cascade paths to `messages` (`users → conversations → messages` already
  cascades). Users are soft-banned, not hard-deleted, so this is safe.
- **Dev** auto-creates both tables via `synchronize` (no filtered index); the
  migration `1756600000000-CreateChatTables` is for prod/parity.
