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
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
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
