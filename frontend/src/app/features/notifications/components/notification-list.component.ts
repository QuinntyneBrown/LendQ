import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatListModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    RelativeTimePipe, LoadingSpinnerComponent, EmptyStateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Notifications</h1>
        <button mat-stroked-button (click)="markAllRead()">
          <mat-icon>done_all</mat-icon> Mark All Read
        </button>
      </div>

      @if (notifications$ | async; as notifications) {
        @if (notifications.length === 0) {
          <app-empty-state icon="notifications_none" title="No notifications"
                           message="You're all caught up!">
          </app-empty-state>
        } @else {
          <mat-list>
            @for (notif of notifications; track notif.id) {
              <mat-list-item [class.unread]="!notif.is_read" (click)="markRead(notif)">
                <mat-icon matListItemIcon [class]="'notif-icon type-' + notif.type.toLowerCase()">
                  {{ getIcon(notif.type) }}
                </mat-icon>
                <span matListItemTitle>{{ notif.title }}</span>
                <span matListItemLine>{{ notif.body }}</span>
                <span matListItemLine class="notif-time">{{ notif.created_at | relativeTime }}</span>
                @if (!notif.is_read) {
                  <div matListItemMeta class="unread-dot"></div>
                }
              </mat-list-item>
            }
          </mat-list>
        }
      } @else {
        <app-loading-spinner></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; }
    .unread { background: rgba(21, 101, 192, 0.04); }
    .unread-dot { width: 10px; height: 10px; border-radius: 50%; background: #1565c0; }
    .notif-time { color: rgba(0,0,0,0.38); font-size: 12px; }
    .type-payment_due, .type-payment_overdue { color: #e65100; }
    .type-payment_received { color: #2e7d32; }
    .type-schedule_changed, .type-loan_modified { color: #1565c0; }
    .type-system { color: rgba(0,0,0,0.54); }
    mat-list-item { cursor: pointer; }
  `]
})
export class NotificationListComponent implements OnInit {
  notifications$!: Observable<Notification[]>;
  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notifications$ = this.notificationService.getNotifications().pipe(map(r => r.items));
  }

  markRead(notif: Notification): void {
    if (notif.is_read) return;
    this.notificationService.markRead(notif.id).subscribe();
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe(() => {
      this.notifications$ = this.notificationService.getNotifications().pipe(map(r => r.items));
    });
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      PAYMENT_DUE: 'schedule', PAYMENT_OVERDUE: 'warning',
      PAYMENT_RECEIVED: 'check_circle', SCHEDULE_CHANGED: 'event',
      LOAN_MODIFIED: 'edit', SYSTEM: 'info',
    };
    return icons[type] || 'notifications';
  }
}
