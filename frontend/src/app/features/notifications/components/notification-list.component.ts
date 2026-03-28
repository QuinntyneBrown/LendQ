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
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss'
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
