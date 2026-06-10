# Notification Feature

## Purpose
In-app notifications for customers when their order status changes. Notifications are created automatically via EventEmitter2 when admin or seller updates an order status.

## Entities
- `notifications` — stores per-user notifications with type, title, message, JSON data payload, and read status

## Event Dependencies
- Listens to: `order.status_updated` (emitted by order.service.ts from admin/seller/customer status changes)
- Does NOT listen to: `order.created` (customer sees success page), `order.cancelled` (stock events, handled by product feature)

## Design Decisions
- **Polling-based delivery** — frontend polls `GET /notifications/unread-count` every 30s. No WebSocket infrastructure needed.
- **Best-effort async** — notification listener is wrapped in try/catch. Failures are logged but never break the order flow.
- **Separate listener from service** — `notification.listener.ts` handles events, `notification.service.ts` handles CRUD for the controller. Clean separation of concerns.
- **Multi-target notifications** — `OrderStatusUpdatedEvent` includes `notifyUserIds: number[]`. The listener creates one notification per user in the array. Admin/seller changes notify customer; customer confirm-receipt and return-request notify seller(s). Order placement and customer cancellation do not create notifications.
- **JSON data field** — stored as NVARCHAR(MAX), parsed safely on read. Contains `orderId`, `oldStatus`, `newStatus` for order status notifications.
- **Future consideration** — cleanup cron for notifications older than 90 days.

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List notifications (paginated, `?is_read` filter) |
| GET | `/notifications/unread-count` | Lightweight count for badge polling |
| PATCH | `/notifications/:id/read` | Mark single as read |
| PATCH | `/notifications/read-all` | Mark all as read (204) |
