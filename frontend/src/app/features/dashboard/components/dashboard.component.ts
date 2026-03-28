import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary, ActivityItem } from '../../../core/models/dashboard.model';
import { LoanSummary } from '../../../core/models/loan.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTabsModule, MatTableModule, MatListModule, MatChipsModule,
    MatProgressSpinnerModule, CurrencyFormatPipe, RelativeTimePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Dashboard</h1>
        <button mat-icon-button (click)="refresh()" aria-label="Refresh">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        @if (summary$ | async; as summary) {
          <mat-card class="summary-card">
            <mat-icon>trending_up</mat-icon>
            <div class="card-content">
              <span class="card-label">Total Lent Out</span>
              <span class="card-value">{{ summary.total_lent_out | currencyFormat }}</span>
            </div>
          </mat-card>
          <mat-card class="summary-card">
            <mat-icon>account_balance_wallet</mat-icon>
            <div class="card-content">
              <span class="card-label">Total Owed</span>
              <span class="card-value">{{ summary.total_owed | currencyFormat }}</span>
            </div>
          </mat-card>
          <mat-card class="summary-card">
            <mat-icon>event</mat-icon>
            <div class="card-content">
              <span class="card-label">Upcoming (7 days)</span>
              <span class="card-value">{{ summary.upcoming_payments_7d }}</span>
            </div>
          </mat-card>
          <mat-card class="summary-card overdue" [class.has-overdue]="summary.overdue_payments > 0">
            <mat-icon>warning</mat-icon>
            <div class="card-content">
              <span class="card-label">Overdue</span>
              <span class="card-value">{{ summary.overdue_payments }}</span>
            </div>
          </mat-card>
          <div class="freshness" *ngIf="summary.generated_at">
            Updated {{ summary.generated_at | relativeTime }}
          </div>
        } @else {
          @for (i of [1,2,3,4]; track i) {
            <mat-card class="summary-card">
              <div class="skeleton-loader" style="width: 100%; height: 60px;"></div>
            </mat-card>
          }
        }
      </div>

      <!-- Loans Section -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Active Loans</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (loans$ | async; as loansData) {
            @if (loansData.items.length === 0) {
              <p class="empty-message">No active loans</p>
            } @else {
              <mat-tab-group>
                <mat-tab label="Loans I Gave">
                  <div class="loan-list">
                    @for (loan of loansData.items; track loan.id) {
                      <div class="loan-row" [routerLink]="['/loans', loan.id]">
                        <div class="loan-info">
                          <strong>{{ loan.description }}</strong>
                          <span class="counterparty">{{ loan.counterparty_name }}</span>
                        </div>
                        <div class="loan-amount">
                          <span>{{ loan.outstanding_balance | currencyFormat }}</span>
                          <mat-chip [class]="'status-chip status-' + loan.status.toLowerCase()">
                            {{ loan.status }}
                          </mat-chip>
                        </div>
                      </div>
                    }
                  </div>
                </mat-tab>
                <mat-tab label="Loans I Owe">
                  <p class="empty-message">Select this tab to view loans where you are the borrower.</p>
                </mat-tab>
              </mat-tab-group>
            }
          } @else {
            <div class="skeleton-loader" style="width: 100%; height: 120px;"></div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Activity Feed -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Recent Activity</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (activity$ | async; as activityData) {
            @if (activityData.items.length === 0) {
              <p class="empty-message">No recent activity</p>
            } @else {
              <mat-list>
                @for (item of activityData.items; track item.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>{{ getActivityIcon(item.type) }}</mat-icon>
                    <span matListItemTitle>{{ item.description }}</span>
                    <span matListItemLine>{{ item.created_at | relativeTime }}</span>
                  </mat-list-item>
                }
              </mat-list>
            }
          } @else {
            <div class="skeleton-loader" style="width: 100%; height: 80px;"></div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .summary-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
    }
    .summary-card {
      display: flex; align-items: center; padding: 20px; gap: 16px;
    }
    .summary-card mat-icon { font-size: 36px; width: 36px; height: 36px; color: #1565c0; }
    .summary-card.has-overdue mat-icon { color: #e65100; }
    .card-content { display: flex; flex-direction: column; }
    .card-label { font-size: 13px; color: rgba(0,0,0,0.54); }
    .card-value { font-size: 24px; font-weight: 500; }
    .freshness { grid-column: 1 / -1; font-size: 12px; color: rgba(0,0,0,0.38); text-align: right; }
    .section-card { margin-bottom: 24px; }
    .loan-list { padding: 8px 0; }
    .loan-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06);
      cursor: pointer; transition: background 0.15s;
    }
    .loan-row:hover { background: rgba(0,0,0,0.04); }
    .loan-info { display: flex; flex-direction: column; }
    .counterparty { font-size: 13px; color: rgba(0,0,0,0.54); }
    .loan-amount { display: flex; align-items: center; gap: 12px; }
    .empty-message { text-align: center; color: rgba(0,0,0,0.54); padding: 24px; }
    .status-chip { font-size: 11px; }
    @media (max-width: 1279px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 767px) { .summary-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  summary$!: Observable<DashboardSummary | null>;
  loans$!: Observable<{ items: LoanSummary[] } | null>;
  activity$!: Observable<{ items: ActivityItem[] } | null>;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.summary$ = this.dashboardService.getSummary();
    this.loans$ = this.dashboardService.getLoans();
    this.activity$ = this.dashboardService.getActivity();
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      payment: 'payment', loan: 'account_balance',
      schedule: 'event', notification: 'notifications'
    };
    return icons[type] || 'info';
  }
}
