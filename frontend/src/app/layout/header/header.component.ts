import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="toggleSidenav.emit()" aria-label="Toggle navigation">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="brand">LendQ</span>
      <span class="spacer"></span>

      <button mat-icon-button
              routerLink="/notifications"
              [matBadge]="(notificationService.unreadCount$ | async) || null"
              matBadgeColor="warn"
              matBadgeSize="small"
              [matBadgeHidden]="(notificationService.unreadCount$ | async) === 0"
              aria-label="Notifications">
        <mat-icon>notifications</mat-icon>
      </button>

      <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu">
        <mat-icon>account_circle</mat-icon>
      </button>

      <mat-menu #userMenu="matMenu">
        @if (authService.currentUser; as user) {
          <div class="user-info" mat-menu-item disabled>
            <strong>{{ user.name }}</strong>
            <br>
            <small>{{ user.email }}</small>
          </div>
        }
        <button mat-menu-item routerLink="/settings/preferences">
          <mat-icon>settings</mat-icon>
          <span>Settings</span>
        </button>
        <button mat-menu-item routerLink="/settings/security">
          <mat-icon>security</mat-icon>
          <span>Security</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="onLogout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    .brand { margin-left: 8px; font-weight: 500; cursor: default; }
    .user-info { line-height: 1.4; white-space: normal; }
  `]
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService
  ) {}

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
