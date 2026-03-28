import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-brand">
      <h2>LendQ</h2>
    </div>
    <mat-nav-list>
      @for (item of visibleItems; track item.route) {
        <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styles: [`
    .sidebar-brand {
      padding: 16px 24px;
      border-bottom: 1px solid rgba(0,0,0,0.12);
      h2 { margin: 0; color: #1565c0; font-weight: 500; }
    }
    .active-link { background: rgba(21, 101, 192, 0.08); }
  `]
})
export class SidebarComponent {
  private navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Loans', icon: 'account_balance', route: '/loans', roles: ['CREDITOR', 'BORROWER'] },
    { label: 'Users', icon: 'people', route: '/users', roles: ['ADMIN'] },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Settings', icon: 'settings', route: '/settings/preferences' },
  ];

  constructor(private authService: AuthService) {}

  get visibleItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.some(r => this.authService.hasRole(r as any));
    });
  }
}
