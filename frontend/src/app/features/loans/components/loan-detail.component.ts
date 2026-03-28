import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, switchMap } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LoanDetail, LoanChangeRequest, LoanTermsVersion } from '../../../core/models/loan.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { CreateEditLoanDialogComponent } from './create-edit-loan-dialog.component';
import { LoanChangeRequestDialogComponent } from './loan-change-request-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTabsModule, MatTableModule, MatListModule, MatDialogModule,
    MatProgressSpinnerModule, CurrencyFormatPipe, RelativeTimePipe, LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-detail.component.html',
  styleUrl: './loan-detail.component.scss'
})
export class LoanDetailComponent implements OnInit {
  loan$!: Observable<LoanDetail>;
  termsVersions$!: Observable<LoanTermsVersion[]>;
  changeRequests$!: Observable<LoanChangeRequest[]>;
  scheduleColumns = ['sequence', 'due_date', 'amount_due', 'amount_paid', 'status'];

  private loanId = '';

  constructor(
    private route: ActivatedRoute,
    private loanService: LoanService,
    public authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loan$ = this.route.paramMap.pipe(
      switchMap(params => {
        this.loanId = params.get('id')!;
        this.loadSideData();
        return this.loanService.getLoan(this.loanId);
      })
    );
  }

  private loadSideData(): void {
    this.termsVersions$ = this.loanService.getTermsVersions(this.loanId).pipe(
      switchMap(r => [r.items])
    );
    this.changeRequests$ = this.loanService.getChangeRequests(this.loanId).pipe(
      switchMap(r => [r.items])
    );
  }

  isCreditor(loan: LoanDetail): boolean {
    return loan.creditor.id === this.authService.currentUser?.id;
  }

  isBorrower(loan: LoanDetail): boolean {
    return loan.borrower.id === this.authService.currentUser?.id;
  }

  openEditDialog(loan: LoanDetail): void {
    this.dialog.open(CreateEditLoanDialogComponent, {
      width: '600px', maxHeight: '90vh',
      data: { loan }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loan$ = this.loanService.getLoan(this.loanId);
        this.loadSideData();
      }
    });
  }

  openChangeRequest(loan: LoanDetail): void {
    this.dialog.open(LoanChangeRequestDialogComponent, {
      width: '500px',
      data: { loanId: loan.id }
    }).afterClosed().subscribe(result => {
      if (result) this.loadSideData();
    });
  }

  approveRequest(loanId: string, requestId: string): void {
    this.loanService.approveChangeRequest(loanId, requestId).subscribe({
      next: () => { this.toast.success('Change request approved'); this.loadSideData(); },
      error: () => this.toast.error('Failed to approve request')
    });
  }

  rejectRequest(loanId: string, requestId: string): void {
    this.loanService.rejectChangeRequest(loanId, requestId).subscribe({
      next: () => { this.toast.success('Change request rejected'); this.loadSideData(); },
      error: () => this.toast.error('Failed to reject request')
    });
  }
}
