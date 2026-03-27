# Module 13: Frontend - Notifications

**Requirements**: L1-6, L1-10, L2-6.1, L2-6.2, L2-6.3, L2-6.4, L2-6.5, L2-7.5, L2-10.3

**Backend API**: [06-notifications.md](06-notifications.md)

## Overview

The notification feature renders the bell badge, dropdown, full notifications page, and toast surface. It now uses Server-Sent Events as the primary live-update path, with on-focus reconciliation rather than periodic polling as the default mechanism.

## Class Diagram

![Class — Notification Module](diagrams/rendered/fe_class_notification.png)

*Source: [diagrams/plantuml/fe_class_notification.puml](diagrams/plantuml/fe_class_notification.puml)*

## API Integration

| Action | Endpoint |
|---|---|
| List notifications | `GET /api/v1/notifications` |
| Unread count | `GET /api/v1/notifications/unread-count` |
| Mark read | `POST /api/v1/notifications/{id}/read` |
| Mark all read | `POST /api/v1/notifications/read-all` |
| Live stream | `GET /api/v1/notifications/stream` |
| Preferences | `GET` / `PUT /api/v1/notification-preferences` |

## Sequence Diagram

![Sequence — Notifications](diagrams/rendered/fe_seq_notifications.png)

*Source: [diagrams/plantuml/fe_seq_notifications.puml](diagrams/plantuml/fe_seq_notifications.puml)*

## Live Update Rules

- `useNotificationStream` opens one SSE connection per authenticated browser session.
- Incoming notification events update unread count, dropdown cache, and optional toast presentation in one reducer path.
- If the stream disconnects, the client backs off and reconnects. On reconnect or tab focus, it revalidates unread count and the newest page of notifications.

## Preferences And Navigation

- Notification settings are linked directly to `/settings/preferences`.
- Disabling email delivery does not suppress in-app notifications.
- Toast dedupe is keyed by notification id or source event id to prevent repeated user-visible effects during retries or reconnects.
