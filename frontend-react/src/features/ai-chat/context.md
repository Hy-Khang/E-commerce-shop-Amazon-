# AI Chatbox (Module 21) — Frontend

## Purpose
Floating storefront chatbox (guest + customer) that suggests products (RAG) and
answers policy FAQs. Admin (Module 13) pages to review conversation history and
toggle the widget / edit the system prompt.

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

## API deps (services/ai-chat.service.ts)
- `POST /ai/chat`, `GET /ai/config`, `GET /ai/conversations/:id`.
- `GET /admin/ai/conversations` + `/:id`, `GET/PATCH /admin/ai/settings`.

## State decisions
- **Zustand `persist` (`ai_chat`)** holds `{ isOpen, conversationId, messages[] }`
  → a thread survives reloads within a session. Server persists the canonical
  conversation; the store is the live UI view (trimmed to newest 50).
- **`useSendAiMessage`** is optimistic: append the user message + a pending
  assistant bubble, then fill it from the reply (or a friendly error). No socket —
  a single request/response. Guest `x-session-id` is attached automatically by the
  axios interceptor (same as cart).
- **`useAiConfig`** gates the widget (5-min stale). Admin settings hooks in
  `useAdminAiChat.ts` (TanStack Query + toast on save).
