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
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Security & Sessions</h1>
        <button mat-stroked-button color="warn" (click)="logoutAllOther()">
          <mat-icon>logout</mat-icon> Log Out All Other Sessions
        </button>
      </div>

      @if (sessions$ | async; as sessions) {
        <!-- Desktop table -->
        <div class="desktop-only">
          <table mat-table [dataSource]="sessions" class="full-width">
            <ng-container matColumnDef="device">
              <th mat-header-cell *matHeaderCellDef>Device</th>
              <td mat-cell *matCellDef="let s">{{ s.user_agent || 'Unknown' }}</td>
            </ng-container>
            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef>Location</th>
              <td mat-cell *matCellDef="let s">{{ s.location_hint || s.ip_address || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="created">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let s">{{ s.created_at | relativeTime }}</td>
            </ng-container>
            <ng-container matColumnDef="lastUsed">
              <th mat-header-cell *matHeaderCellDef>Last Used</th>
              <td mat-cell *matCellDef="let s">{{ s.last_seen_at | relativeTime }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                @if (s.is_current) { <mat-chip color="primary" highlighted>Current</mat-chip> }
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s">
                @if (!s.is_current) {
                  <button mat-button color="warn" (click)="revokeSession(s)"
                          [attr.aria-label]="'Revoke session from ' + (s.user_agent || 'unknown device')">
                    Revoke
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="mobile-only">
          @for (s of sessions; track s.id) {
            <mat-card class="session-card">
              <mat-card-header>
                <mat-card-title>{{ s.user_agent || 'Unknown Device' }}</mat-card-title>
                @if (s.is_current) { <mat-chip color="primary" highlighted>Current</mat-chip> }
              </mat-card-header>
              <mat-card-content>
                <div class="session-info">
                  <span>Location: {{ s.location_hint || s.ip_address || '—' }}</span>
                  <span>Last used: {{ s.last_seen_at | relativeTime }}</span>
                </div>
              </mat-card-content>
              @if (!s.is_current) {
                <mat-card-actions>
                  <button mat-button color="warn" (click)="revokeSession(s)">Revoke</button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
      } @else {
        <app-loading-spinner></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { margin: 0; }
    .full-width { width: 100%; }
    .session-card { margin-bottom: 12px; }
    .session-info { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: rgba(0,0,0,0.54); }
  `]
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
