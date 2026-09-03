# AI Chatbox → AI Shopping Agent (Module 21) — Frontend

## Purpose
Floating storefront assistant (guest + customer). Suggests products (RAG) + answers
FAQs, **and** acts as an agent: the backend runs tool calls and returns `actions[]`
cards the widget renders — add-to-cart summaries and a **mini-checkout** the customer
confirms to place the order (money moves only on that click). Admin (Module 13) pages
review history (incl. agent actions) and toggle the widget / edit the system prompt.

## Pages
- `AdminAiConversationListPage` — `/admin/ai-conversations` (paginated list).
- `AdminAiConversationDetailPage` — `/admin/ai-conversations/:id` (thread view).
- `AdminAiSettingsPage` — `/admin/ai-settings` (enable toggle + prompt).

All three sit under the `AdminLayout` block (`PortalGuard PORTAL_ADMIN`) — the
`ai_chatbox:*` permission gates only the API; admin has both.

## Components
- `AiChatWidget` — FAB + panel, mounted once in `MainLayout` (after `<Footer/>`).
  Hidden entirely when `GET /ai/config` reports `enabled: false`.
- `AiChatPanel`, `AiMessageList`, `AiMessageBubble`, `AiChatInput`,
  `AiProductSuggestions` (reuses `ProductCard` from `@/features/product`).
- **Agent action cards** (rendered by `AiMessageBubble` → `AiActionCards`):
  - `AiCartUpdateCard` — "Giỏ hàng đã cập nhật" summary + link to `/cart`.
  - `AiCheckoutProposalCard` — **mini-checkout**: shows `previewCheckout` totals, an
    address picker (`useAddresses`, preselect default) + payment method; Confirm calls
    `useCheckout` (`POST /orders`) then `useCreatePayment` for VNPay/MoMo. On success it
    fires `onPlaced` so `AiActionCards` **swaps the card in the store** for an
    `order_placed` card (persisted → a completed order never re-renders a stale confirm
    form on resume). Guest → in-widget login CTA; no address → "Add address" CTA. Reuses
    `@/features/order`, `@/features/payment`, `@/features/user-profile`, `@/features/auth`.
  - `AiOrderPlacedCard` — success notification + "what next?" chips (View my orders /
    Keep shopping via `onPickSuggestion`). Client-only action `order_placed` (never
    produced by the backend — the backend still stores the original `checkout_proposal`).
  - `AiLoginPrompt` — **in-widget login popup** (overlay inside `AiChatPanel`). Opened by
    the `needs_login` card / guest checkout CTA (`openLoginPrompt`). Uses
    `useLogin({ redirect: false, onSuccess })` so it stays in the widget, merges the guest
    cart, then `AiChatPanel.handleResumeAfterLogin` **re-sends `pendingIntent`** — the agent
    continues the interrupted checkout without the shopper re-typing.
  - `order_cancelled` / `needs_login` render inline in `AiActionCards`.

## API deps (services/ai-chat.service.ts)
- `POST /ai/chat`, `GET /ai/config`, `GET /ai/conversations/:id`.
- `GET /admin/ai/conversations` + `/:id`, `GET/PATCH /admin/ai/settings`.

## State decisions
- **Zustand `persist` (`ai_chat`)** holds `{ conversationId, messages[], size }`
  → a thread survives reloads within a session. Server persists the canonical
  conversation; the store is the live UI view (trimmed to newest 50). Ephemeral
  `loginPromptOpen` / `pendingIntent` are **not** persisted.
- **Login resume:** when a reply carries a `needs_login` action, `useSendAiMessage`
  saves that turn's message as `pendingIntent`; after the in-widget login succeeds it is
  re-sent and cleared, so the blocked action (e.g. checkout) continues in the same thread.
  The backend `resolveConversation` self-heals a guest thread carried into a logged-in
  session (starts a fresh owned thread) — no `CHATBOT_003`.
- **`useSendAiMessage`** is optimistic: append the user message + a pending
  assistant bubble, then fill it from the reply — `content`, `products`, **and
  `actions`** (or a friendly error). No socket — a single request/response (the
  backend runs the whole tool loop server-side). Guest `x-session-id` is attached
  automatically by the axios interceptor (same as cart).
- **`useAiConfig`** gates the widget (5-min stale). Admin settings hooks in
  `useAdminAiChat.ts` (TanStack Query + toast on save).
