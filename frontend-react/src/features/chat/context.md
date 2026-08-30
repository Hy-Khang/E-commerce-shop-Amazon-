# Chat Feature (Module 20 — Chat Realtime)

## Purpose
Realtime Customer ↔ Seller messaging: conversation list, text threads, unread
badge, mark-as-read, plus **typing indicators, online presence, and read
receipts** (`sent → delivered → read`). Built on the **shared** Socket.IO client
from Module 11 (Notifications) — one connection, not a second socket.

## Pages
- `ChatPage` (customer) — two-pane list + thread. Routes `/chat`,
  `/chat/:conversationId` under `MainLayout` + `AuthGuard`.
- `SellerChatPage` (seller) — same components, selection via `?c=<id>`. Route
  `/seller/chat` under `SellerLayout` + `PortalGuard(seller)`.

## API deps (`/api/v1/chat`, JWT)
`chat.service.ts` — `POST /chat/conversations`, `GET /chat/conversations`,
`GET /chat/conversations/:id/messages`, `POST /chat/conversations/:id/messages`,
`PATCH /chat/conversations/:id/read`, `GET /chat/unread-count`.

## Realtime
- `useRealtimeChat` (mounted once in `AppProviders`) attaches listeners to the
  shared socket: `chat:new_message` (upsert into the messages cache by id, dedup
  self-echo + optimistic temps; bump conversations; badge/toast only when the
  message is from the other party and its conversation isn't open),
  `chat:read` (advance own bubbles), `chat:typing`, `chat:presence`. It removes
  only its own listeners on cleanup — **never** `disconnectSocket()`.
- `useChatRoom(conversationId)` (in `MessageThread`) emits `chat:join` on open
  and on `socket.on('connect')` (reconnect), `chat:leave` on unmount, and a
  debounced `chat:typing`.

## State
- **TanStack Query** owns server data: `chatKeys.conversations()`,
  `chatKeys.messages(id)` (chronological), `chatKeys.unreadCount()`.
- **Zustand `useChatStore`** holds client-only chat UI state: `unreadTotal`
  (header badge), `activeConversationId` (suppresses its own toast/badge),
  `typingByConversation`, `onlineByConversation`. No server data in Zustand.
- Send is **optimistic** (temp negative-id bubble → replaced on success /
  rolled back on error), modeled on `useAddToCart`.

## Integration points
- `ChatBadge` in `Header.tsx` (gated `isAuthenticated`). Seller portal shows the
  unread count on the `SellerLayout` "Messages" nav link via `useChatUnreadBadge`.
- `ChatWithShopButton` in `ShopInfoCard` / `ShopHeader`. Guests → login with
  `state.from` so `useLogin` returns them to the page; `ShopHeader` hides the
  button on the viewer's own shop.

## Design note
Seller chat reuses the storefront-styled components inside the amber portal —
a deliberate, documented exception to DESIGN.md §12 (two design languages).
