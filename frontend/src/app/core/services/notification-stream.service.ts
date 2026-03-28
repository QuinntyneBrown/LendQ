import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationStreamService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private maxRetry = 5;
  private seenIds = new Set<string>();

  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  constructor(private zone: NgZone, private authService: AuthService) {}

  connect(): void {
    this.disconnect();
    this.retryCount = 0;
    this.openConnection();
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private openConnection(): void {
    const token = this.authService.token;
    if (!token) return;

    this.eventSource = new EventSource(`/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      this.zone.run(() => {
        const notification: Notification = JSON.parse(event.data);
        if (!this.seenIds.has(notification.id)) {
          this.seenIds.add(notification.id);
          this.notificationSubject.next(notification);
        }
      });
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      this.scheduleReconnect();
    };

    this.eventSource.onopen = () => {
      this.retryCount = 0;
    };
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.maxRetry) return;
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
    this.retryCount++;
    this.reconnectTimeout = setTimeout(() => this.openConnection(), delay);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
