import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Notification, NotificationPreferences } from '../models/notification.model';
import { PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private recentSubject = new BehaviorSubject<Notification[]>([]);

  unreadCount$ = this.unreadCountSubject.asObservable();
  recent$ = this.recentSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadUnreadCount(): void {
    this.http.get<{ count: number }>('/api/v1/notifications/unread-count').subscribe({
      next: res => this.unreadCountSubject.next(res.count),
      error: () => {}
    });
  }

  getNotifications(): Observable<PaginatedResponse<Notification>> {
    return this.http.get<PaginatedResponse<Notification>>('/api/v1/notifications');
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`/api/v1/notifications/${id}/read`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
        const recent = this.recentSubject.value.map(n => n.id === id ? { ...n, is_read: true } : n);
        this.recentSubject.next(recent);
      })
    );
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>('/api/v1/notifications/read-all', {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
        const recent = this.recentSubject.value.map(n => ({ ...n, is_read: true }));
        this.recentSubject.next(recent);
      })
    );
  }

  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>('/api/v1/notification-preferences');
  }

  updatePreferences(prefs: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>('/api/v1/notification-preferences', prefs);
  }

  prependNotification(notification: Notification): void {
    const current = this.recentSubject.value;
    this.recentSubject.next([notification, ...current].slice(0, 20));
    if (!notification.is_read) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }
  }
}
