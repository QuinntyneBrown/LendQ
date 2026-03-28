# Module 13: Frontend - Notifications

**Requirements**: L1-6, L1-10, L2-6.1, L2-6.2, L2-6.3, L2-6.4, L2-6.5, L2-7.5, L2-10.3

**Backend API**: [06-notifications.md](06-notifications.md)

## Overview

The notification feature renders the bell badge, dropdown, full notifications page, and toast surface. It uses Server-Sent Events as the primary live-update path, with on-focus reconciliation rather than periodic polling as the default mechanism. The SSE connection is managed by `NotificationStreamService`, and toast presentation uses `MatSnackBar` from Angular Material.

## Class Diagram

![Class - Notification Module](diagrams/rendered/fe_class_notification.png)

*Source: [diagrams/plantuml/fe_class_notification.puml](diagrams/plantuml/fe_class_notification.puml)*

## NotificationService

`NotificationService` is an `@Injectable({ providedIn: 'root' })` service for REST operations:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  getNotifications(params?: NotificationParams): Observable<PaginatedResponse<Notification>> {
    return this.http.get<PaginatedResponse<Notification>>(`${this.apiUrl}/notifications`, { params: toHttpParams(params) });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/notifications/unread-count`);
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/read-all`, {});
  }
}
```

## NotificationStreamService

`NotificationStreamService` is an `@Injectable({ providedIn: 'root' })` service that manages the SSE connection using the native `EventSource` API:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationStreamService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private notificationSubject = new Subject<NotificationEvent>();
  notification$ = this.notificationSubject.asObservable();

  connect(token: string): void {
    this.eventSource = new EventSource(`/api/v1/notifications/stream?token=${token}`);
    this.eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data) as NotificationEvent;
      this.notificationSubject.next(notification);
    };
    this.eventSource.onerror = () => this.reconnectWithBackoff();
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
  }
}
```

## ToastService

`ToastService` is an `@Injectable({ providedIn: 'root' })` service that wraps `MatSnackBar`:

```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, action?: string, duration = 5000): void {
    this.snackBar.open(message, action ?? 'Dismiss', { duration });
  }
}
```

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

![Sequence - Notifications](diagrams/rendered/fe_seq_notifications.png)

*Source: [diagrams/plantuml/fe_seq_notifications.puml](diagrams/plantuml/fe_seq_notifications.puml)*

## Live Update Rules

- `NotificationStreamService` opens one SSE connection via the native `EventSource` API per authenticated browser session.
- Incoming notification events update unread count (via `BehaviorSubject<number>`), dropdown cache, and optional toast presentation (`MatSnackBar`) in one RxJS pipeline:

```typescript
this.notificationStream.notification$.pipe(
  takeUntilDestroyed(this.destroyRef),
).subscribe((event) => {
  this.unreadCount$.next(this.unreadCount$.value + 1);
  this.prependToDropdown(event);
  if (this.shouldShowToast(event)) {
    this.toastService.show(event.title);
  }
});
```

- If the stream disconnects, the service backs off and reconnects. On reconnect or tab focus, it revalidates unread count and the newest page of notifications via `NotificationService`.

## Notification State

Notification state is managed via RxJS `BehaviorSubject` within a `NotificationStateService`:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  private unreadCount$ = new BehaviorSubject<number>(0);
  unreadCount = this.unreadCount$.asObservable();

  private recentNotifications$ = new BehaviorSubject<Notification[]>([]);
  recent = this.recentNotifications$.asObservable();
}
```

Components consume this state via the `async` pipe with `ChangeDetectionStrategy.OnPush`.

## Preferences And Navigation

- Notification settings are linked directly to `/settings/preferences` via `routerLink`.
- Disabling email delivery does not suppress in-app notifications.
- Toast dedupe is keyed by notification id or source event id to prevent repeated user-visible effects during retries or reconnects.
