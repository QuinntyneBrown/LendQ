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
  templateUrl: './payment-schedule.component.html',
  styleUrl: './payment-schedule.component.scss'
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
