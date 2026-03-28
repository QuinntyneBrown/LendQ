import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MobileNavComponent } from './mobile-nav.component';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationStreamService } from '../../core/services/notification-stream.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, HeaderComponent, SidebarComponent, MobileNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout-container">
      <app-header (toggleSidenav)="sidenav.toggle()"></app-header>
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav
                     [mode]="sidenavMode"
                     [opened]="sidenavOpened"
                     class="app-sidenav">
          <app-sidebar></app-sidebar>
        </mat-sidenav>
        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
      @if (isMobile) {
        <app-mobile-nav></app-mobile-nav>
      }
    </div>
  `,
  styles: [`
    .layout-container { display: flex; flex-direction: column; height: 100vh; }
    .sidenav-container { flex: 1; }
    .app-sidenav { width: 260px; }
    .main-content { padding: 0; overflow-y: auto; }
    @media (max-width: 767px) {
      .main-content { padding-bottom: 56px; }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  sidenavMode: 'side' | 'over' = 'side';
  sidenavOpened = true;
  isMobile = false;

  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private notificationService: NotificationService,
    private notificationStreamService: NotificationStreamService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset, '(max-width: 1279px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const isSmall = result.breakpoints[Breakpoints.Handset] || false;
        const isMedium = result.breakpoints['(max-width: 1279px)'] || false;
        this.isMobile = isSmall;
        if (isSmall) {
          this.sidenavMode = 'over';
          this.sidenavOpened = false;
        } else if (isMedium) {
          this.sidenavMode = 'over';
          this.sidenavOpened = false;
        } else {
          this.sidenavMode = 'side';
          this.sidenavOpened = true;
        }
      });

    this.notificationService.loadUnreadCount();
    this.notificationStreamService.connect();

    this.notificationStreamService.notification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.notificationService.prependNotification(notification);
        this.toastService.info(notification.title);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificationStreamService.disconnect();
  }
}
