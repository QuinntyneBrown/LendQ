import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="mobile-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
        <mat-icon>dashboard</mat-icon>
        <span>Home</span>
      </a>
      @if (authService.hasAnyRole(['CREDITOR', 'BORROWER'])) {
        <a routerLink="/loans" routerLinkActive="active" class="nav-item">
          <mat-icon>account_balance</mat-icon>
          <span>Loans</span>
        </a>
      }
      <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
        <mat-icon>notifications</mat-icon>
        <span>Alerts</span>
      </a>
      <a routerLink="/settings/preferences" routerLinkActive="active" class="nav-item">
        <mat-icon>settings</mat-icon>
        <span>Settings</span>
      </a>
    </nav>
  `,
  styles: [`
    .mobile-nav {
      position: fixed; bottom: 0; left: 0; right: 0;
      display: flex; justify-content: space-around;
      background: white; border-top: 1px solid rgba(0,0,0,0.12);
      z-index: 100; padding: 4px 0;
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center;
      text-decoration: none; color: rgba(0,0,0,0.54);
      font-size: 11px; padding: 4px 12px; min-width: 44px;
    }
    .nav-item.active { color: #1565c0; }
    .nav-item mat-icon { font-size: 22px; width: 22px; height: 22px; }
  `]
})
export class MobileNavComponent {
  constructor(public authService: AuthService) {}
}
