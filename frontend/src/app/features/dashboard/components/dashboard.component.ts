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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
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
