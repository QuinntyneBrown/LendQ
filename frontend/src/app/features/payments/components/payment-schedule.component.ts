import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, switchMap, map } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ScheduleInstallment } from '../../../core/models/loan.model';
import { PaymentTransaction } from '../../../core/models/payment.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { RecordPaymentDialogComponent } from './record-payment-dialog.component';
import { RescheduleDialogComponent } from './reschedule-dialog.component';
import { PauseDialogComponent } from './pause-dialog.component';
import { ReversePaymentDialogComponent } from './reverse-payment-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payment-schedule',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatDialogModule, MatTabsModule, MatListModule,
    MatProgressSpinnerModule, CurrencyFormatPipe, RelativeTimePipe, LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <button mat-icon-button [routerLink]="['/loans', loanId]" aria-label="Back">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="inline-title">Payments</h1>
        </div>
        <div class="actions">
          <button mat-flat-button color="primary" (click)="openRecordPayment()">
            <mat-icon>add</mat-icon> Record Payment
          </button>
          <button mat-stroked-button (click)="openReschedule()">
            <mat-icon>event</mat-icon> Reschedule
          </button>
          <button mat-stroked-button (click)="openPause()">
            <mat-icon>pause</mat-icon> Pause
          </button>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Schedule">
          @if (installments$ | async; as installments) {
            @if (installments.length === 0) {
              <p class="empty-tab">No schedule available</p>
            } @else {
              <table mat-table [dataSource]="installments" class="full-width">
                <ng-container matColumnDef="sequence">
                  <th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let i">{{ i.sequence }}</td>
                </ng-container>
                <ng-container matColumnDef="due_date">
                  <th mat-header-cell *matHeaderCellDef>Due Date</th>
                  <td mat-cell *matCellDef="let i">
                    {{ i.due_date }}
                    @if (i.original_due_date && i.original_due_date !== i.due_date) {
                      <span class="original-date">(was {{ i.original_due_date }})</span>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="amount_due">
                  <th mat-header-cell *matHeaderCellDef>Amount Due</th>
                  <td mat-cell *matCellDef="let i">{{ i.amount_due | currencyFormat }}</td>
                </ng-container>
                <ng-container matColumnDef="amount_paid">
                  <th mat-header-cell *matHeaderCellDef>Paid</th>
                  <td mat-cell *matCellDef="let i">{{ i.amount_paid | currencyFormat }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let i">
                    <mat-chip [class]="'status-' + i.status.toLowerCase()">{{ i.status }}</mat-chip>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="scheduleColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: scheduleColumns;"></tr>
              </table>
            }
          } @else {
            <app-loading-spinner></app-loading-spinner>
          }
        </mat-tab>

        <mat-tab label="History">
          @if (transactions$ | async; as transactions) {
            @if (transactions.length === 0) {
              <p class="empty-tab">No payment history</p>
            } @else {
              <mat-list>
                @for (tx of transactions; track tx.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon [class]="'tx-icon tx-' + tx.transaction_type.toLowerCase()">
                      {{ getTransactionIcon(tx.transaction_type) }}
                    </mat-icon>
                    <span matListItemTitle>
                      {{ tx.transaction_type }} — {{ tx.amount | currencyFormat }}
                      @if (tx.payment_method) { via {{ tx.payment_method }} }
                    </span>
                    <span matListItemLine>
                      {{ tx.posted_at | relativeTime }}
                      @if (tx.notes) { · {{ tx.notes }} }
                    </span>
                    @if (tx.transaction_type === 'PAYMENT') {
                      <button matListItemMeta mat-icon-button (click)="openReverse(tx)" aria-label="Reverse payment">
                        <mat-icon>undo</mat-icon>
                      </button>
                    }
                  </mat-list-item>
                }
              </mat-list>
            }
          } @else {
            <app-loading-spinner></app-loading-spinner>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .inline-title { display: inline; vertical-align: middle; margin: 0 0 0 8px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .full-width { width: 100%; }
    .original-date { text-decoration: line-through; color: rgba(0,0,0,0.38); margin-left: 4px; font-size: 12px; }
    .empty-tab { text-align: center; color: rgba(0,0,0,0.54); padding: 32px; }
    .tx-icon.tx-payment { color: #2e7d32; }
    .tx-icon.tx-reversal { color: #c62828; }
    .tx-icon.tx-adjustment { color: #f9a825; }
    @media (max-width: 767px) {
      .page-header { flex-direction: column; }
      .actions { width: 100%; }
      .actions button { flex: 1; }
    }
  `]
})
export class PaymentScheduleComponent implements OnInit {
  loanId = '';
  installments$!: Observable<ScheduleInstallment[]>;
  transactions$!: Observable<PaymentTransaction[]>;
  scheduleColumns = ['sequence', 'due_date', 'amount_due', 'amount_paid', 'status'];

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    public authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loanId = this.route.snapshot.paramMap.get('id')!;
    this.loadData();
  }

  private loadData(): void {
    this.installments$ = this.paymentService.getSchedule(this.loanId).pipe(map(s => s.installments));
    this.transactions$ = this.paymentService.getPayments(this.loanId).pipe(map(r => r.items));
  }

  openRecordPayment(): void {
    this.dialog.open(RecordPaymentDialogComponent, {
      width: '500px', data: { loanId: this.loanId }
    }).afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openReschedule(): void {
    this.dialog.open(RescheduleDialogComponent, {
      width: '500px', data: { loanId: this.loanId }
    }).afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openPause(): void {
    this.dialog.open(PauseDialogComponent, {
      width: '500px', data: { loanId: this.loanId }
    }).afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openReverse(tx: PaymentTransaction): void {
    this.dialog.open(ReversePaymentDialogComponent, {
      width: '500px', data: { paymentId: tx.id, amount: tx.amount }
    }).afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'PAYMENT': return 'payment';
      case 'REVERSAL': return 'undo';
      case 'ADJUSTMENT': return 'tune';
      default: return 'receipt';
    }
  }
}
