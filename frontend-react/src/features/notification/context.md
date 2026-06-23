# Notification Feature

## Purpose
In-app notification bell with dropdown panel, plus a full notifications page. Used across all portals (customer, seller, admin, shipper). Each portal sees only its own notifications via `context` query param filtering.

## Components
- `NotificationBell` — bell icon + unread badge in header, toggles dropdown. Detects portal context from URL.
- `NotificationDropdown` — absolute-positioned panel, shows latest 10 notifications, mark-all-as-read button, click-outside to dismiss
- `NotificationItem` — single notification row in dropdown, click navigates to order detail, marks as read
- `NotificationPageItem` — card-style notification for the full page view

## State
- **Server state:** TanStack Query — notification list + unread count (context-filtered)
- **Zustand store:** `useNotificationStore` — `unreadCount` synced from polling query, read by bell badge + sidebar
- **Polling:** `useUnreadCount(context)` polls `GET /notifications/unread-count?context=X` every 30s when authenticated

## Context Routing
`useNotificationRoutes` detects the portal from URL path and returns the appropriate `context`, `orderDetailPath`, and `notificationsPath`. This ensures:
- Customer portal (`/`) → `context=customer`, links to `/orders/:id`
- Seller portal (`/seller`) → `context=seller`, links to `/seller/orders/:id`
- Admin portal (`/admin`) → `context=admin`, links to `/admin/orders/:id`

## API Dependencies
- `GET /notifications?context=X` — paginated list with `?is_read` and `?context` filters
- `GET /notifications/unread-count?context=X` — lightweight count for badge polling
- `PATCH /notifications/:id/read` — mark single as read
- `PATCH /notifications/read-all?context=X` — mark all as read (scoped to portal)

## Cache Invalidation
- Checkout success / cancel order → invalidate `['notifications']`
- Mark read / mark all read → invalidate `['notifications']` + `['notifications', 'unread-count']`

## Design Decisions
- Polling (30s) instead of WebSocket — simpler, sufficient for order notifications
- Optimistic updates on mark-as-read mutations — instant UI feedback, rollback on error
- Unread count in Zustand for cross-component access (header badge, account sidebar)
- Context-aware: same components render correctly in customer, seller, and admin portals
