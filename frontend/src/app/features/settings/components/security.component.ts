import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable, map, BehaviorSubject, switchMap } from 'rxjs';
import { SecurityService } from '../../../core/services/security.service';
import { SessionSummary } from '../../../core/models/user.model';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatDialogModule,
    RelativeTimePipe, LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss'
})
export class SecurityComponent implements OnInit {
  sessions$!: Observable<SessionSummary[]>;
  displayedColumns = ['device', 'location', 'created', 'lastUsed', 'status', 'actions'];
  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(
    private securityService: SecurityService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.sessions$ = this.refresh$.pipe(
      switchMap(() => this.securityService.getSessions()),
      map(r => r.items)
    );
  }

  revokeSession(session: SessionSummary): void {
    const data: ConfirmDialogData = {
      title: 'Revoke Session',
      message: `Revoke session from "${session.user_agent || 'unknown device'}"?`,
      confirmText: 'Revoke',
      isDestructive: true,
    };
    this.dialog.open(ConfirmDialogComponent, { width: '400px', data })
      .afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.securityService.revokeSession(session.id).subscribe({
            next: () => { this.toast.success('Session revoked'); this.refresh$.next(); },
            error: () => this.toast.error('Failed to revoke session')
          });
        }
      });
  }

  logoutAllOther(): void {
    const data: ConfirmDialogData = {
      title: 'Log Out All Other Sessions',
      message: 'This will revoke all sessions except the current one. Continue?',
      confirmText: 'Log Out All',
      isDestructive: true,
    };
    this.dialog.open(ConfirmDialogComponent, { width: '400px', data })
      .afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.securityService.logoutAll().subscribe({
            next: () => { this.toast.success('All other sessions revoked'); this.refresh$.next(); },
            error: () => this.toast.error('Failed to log out sessions')
          });
        }
      });
  }
}
