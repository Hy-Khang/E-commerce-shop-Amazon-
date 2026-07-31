# Notification Feature

## Purpose
In-app notifications for customers and sellers. Notifications are created automatically via EventEmitter2 when order-related events occur. Each notification has a `context` field (customer/seller/admin) to route it to the correct portal.

## Entities
- `notifications` — stores per-user notifications with type, context, title, message, JSON data payload, and read status

## Event Dependencies
- Listens to: `order.placed` (new order → notify sellers), `order.status_updated` (status changes → notify affected parties)
- Does NOT listen to: `order.created` (stock deduction, handled by product feature), `order.cancelled` (stock restoration, handled by product feature)

## Notification Types
- `NEW_ORDER` — seller receives when a customer places an order containing their products. Data: `{ orderId, totalAmount, itemCount }`
- `ORDER_STATUS_CHANGED` — customer/seller receives on status transitions. Data: `{ orderId, oldStatus, newStatus, actorType }`

## Who Gets Notified
| Action | Actor | Notified |
|--------|-------|----------|
| Place order (checkout) | Customer | Seller(s) — `NEW_ORDER` |
| Cancel order | Customer | Seller(s) — `ORDER_STATUS_CHANGED` |
| Confirm receipt | Customer | Seller(s) — `ORDER_STATUS_CHANGED` |
| Request return | Customer | Seller(s) — `ORDER_STATUS_CHANGED` |
| Change order status | Admin | Customer — `ORDER_STATUS_CHANGED` |
| Change order status | Seller | Customer — `ORDER_STATUS_CHANGED` |
| Auto-complete (cron) | System | Customer — `ORDER_STATUS_CHANGED` |

## Design Decisions
- **Dual delivery: Socket.IO + polling fallback** — primary delivery via Socket.IO WebSocket (`new_notification` event). Polling `GET /notifications/unread-count` every 30s as fallback when socket is disconnected.
- **Socket.IO Gateway** — `NotificationGateway` (`@WebSocketGateway`) with JWT auth in handshake. Clients join `user:{userId}` rooms. `sendToUser(userId, dto)` emits to the user's room. Exported from `NotificationModule` for reuse by Module 20 (Chat Realtime).
- **Notification creation pipeline** — `NotificationListener` → `NotificationService.createNotification()` → persist to DB + emit via gateway. All notification creation goes through the service to ensure both persistence and realtime delivery.
- **Best-effort async** — notification listener is wrapped in try/catch. Failures are logged but never break the order flow.
- **Multi-target notifications** — events include arrays of user IDs. The listener creates one notification per user, determining context based on whether the recipient is the order owner (customer) or a shop owner (seller).
- **Context-based filtering** — API supports `?context=seller` to filter notifications by portal. Each portal (customer/seller/admin) only sees its own notifications.
- **JSON data field** — stored as NVARCHAR(MAX), parsed safely on read. Both `NEW_ORDER` and `ORDER_STATUS_CHANGED` include `orderId` for order detail navigation.
- **Frontend socket** — singleton `socket.io-client` instance in `core/socket/socket.service.ts`. `useRealtimeNotifications` hook listens for `new_notification`, updates Zustand unread count, invalidates TanStack Query cache, shows Sonner toast.
- **Future consideration** — cleanup cron for notifications older than 90 days.

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List notifications (paginated, `?is_read` filter) |
| GET | `/notifications/unread-count` | Lightweight count for badge polling |
| PATCH | `/notifications/:id/read` | Mark single as read |
| PATCH | `/notifications/read-all` | Mark all as read (204) |
