# Notification Feature

## Purpose
In-app notification bell in the header with dropdown panel. Shows customer notifications when their order status is changed by admin/seller.

## Components
- `NotificationBell` — bell icon + unread badge in header, toggles dropdown
- `NotificationDropdown` — absolute-positioned panel, shows latest 10 notifications, mark-all-as-read button, click-outside to dismiss
- `NotificationItem` — single notification row, click navigates to order detail, marks as read

## State
- **Server state:** TanStack Query — notification list + unread count
- **Zustand store:** `useNotificationStore` — `unreadCount` synced from polling query, read by bell badge
- **Polling:** `useUnreadCount` polls `GET /notifications/unread-count` every 30s when authenticated

## API Dependencies
- `GET /notifications` — paginated list with `?is_read` filter
- `GET /notifications/unread-count` — lightweight count for badge polling
- `PATCH /notifications/:id/read` — mark single as read
- `PATCH /notifications/read-all` — mark all as read

## Cache Invalidation
- Checkout success / cancel order → invalidate `['notifications']`
- Mark read / mark all read → invalidate `['notifications']` + `['notifications', 'unread-count']`

## Design Decisions
- Polling (30s) instead of WebSocket — simpler, sufficient for order status notifications
- Optimistic updates on mark-as-read mutations — instant UI feedback, rollback on error
- Unread count in Zustand for cross-component access (header badge reads it)
- Click-outside dismiss implemented inline (useEffect + mousedown listener)
