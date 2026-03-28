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
  template: `
    <div class="page-container">
      @if (loan$ | async; as loan) {
        <div class="page-header">
          <div>
            <button mat-icon-button routerLink="/loans" aria-label="Back to loans">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="inline-title">{{ loan.description }}</h1>
            <mat-chip [class]="'status-' + loan.status.toLowerCase()">{{ loan.status }}</mat-chip>
          </div>
          <div class="actions">
            @if (isCreditor(loan)) {
              <button mat-flat-button color="primary" (click)="openEditDialog(loan)">
                <mat-icon>edit</mat-icon> Edit
              </button>
            }
            @if (isBorrower(loan)) {
              <button mat-stroked-button (click)="openChangeRequest(loan)">
                <mat-icon>send</mat-icon> Request Change
              </button>
            }
            <button mat-flat-button color="accent" [routerLink]="['/loans', loan.id, 'payments']">
              <mat-icon>payment</mat-icon> Payments
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="detail-grid">
          <mat-card class="detail-card">
            <span class="detail-label">Principal</span>
            <span class="detail-value">{{ loan.principal_amount | currencyFormat }}</span>
          </mat-card>
          <mat-card class="detail-card">
            <span class="detail-label">Outstanding Balance</span>
            <span class="detail-value">{{ loan.outstanding_balance | currencyFormat }}</span>
          </mat-card>
          <mat-card class="detail-card">
            <span class="detail-label">Next Due</span>
            <span class="detail-value">{{ loan.next_due_date || 'N/A' }}</span>
          </mat-card>
          <mat-card class="detail-card">
            <span class="detail-label">Borrower</span>
            <span class="detail-value">{{ loan.borrower.name }}</span>
          </mat-card>
          <mat-card class="detail-card">
            <span class="detail-label">Creditor</span>
            <span class="detail-value">{{ loan.creditor.name }}</span>
          </mat-card>
        </div>

        <!-- Tabs -->
        <mat-tab-group>
          <mat-tab label="Schedule">
            @if (loan.current_schedule_version.installments.length) {
              <table mat-table [dataSource]="loan.current_schedule_version.installments" class="full-width">
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
                  <th mat-header-cell *matHeaderCellDef>Amount Paid</th>
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
            } @else {
              <p class="empty-tab">No schedule available</p>
            }
          </mat-tab>

          <mat-tab label="Terms History">
            @if (termsVersions$ | async; as versions) {
              <mat-list>
                @for (v of versions; track v.version) {
                  <mat-list-item>
                    <span matListItemTitle>Version {{ v.version }} — {{ v.reason }}</span>
                    <span matListItemLine>Effective: {{ v.effective_at | relativeTime }}</span>
                  </mat-list-item>
                }
              </mat-list>
            }
          </mat-tab>

          <mat-tab label="Change Requests">
            @if (changeRequests$ | async; as requests) {
              @if (requests.length === 0) {
                <p class="empty-tab">No change requests</p>
              } @else {
                <mat-list>
                  @for (req of requests; track req.id) {
                    <mat-list-item>
                      <span matListItemTitle>{{ req.type }} — {{ req.reason }}</span>
                      <span matListItemLine>
                        By {{ req.requested_by.name }} · {{ req.created_at | relativeTime }}
                        · <mat-chip [class]="'status-' + req.status.toLowerCase()">{{ req.status }}</mat-chip>
                      </span>
                      @if (req.status === 'PENDING' && isCreditor(loan)) {
                        <div matListItemMeta>
                          <button mat-icon-button color="primary" (click)="approveRequest(loan.id, req.id)" aria-label="Approve">
                            <mat-icon>check</mat-icon>
                          </button>
                          <button mat-icon-button color="warn" (click)="rejectRequest(loan.id, req.id)" aria-label="Reject">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                      }
                    </mat-list-item>
                  }
                </mat-list>
              }
            }
          </mat-tab>
        </mat-tab-group>
      } @else {
        <app-loading-spinner></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .inline-title { display: inline; margin: 0 12px 0 0; vertical-align: middle; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .detail-card { padding: 16px; display: flex; flex-direction: column; }
    .detail-label { font-size: 12px; color: rgba(0,0,0,0.54); }
    .detail-value { font-size: 18px; font-weight: 500; margin-top: 4px; }
    .full-width { width: 100%; }
    .original-date { text-decoration: line-through; color: rgba(0,0,0,0.38); margin-left: 4px; font-size: 12px; }
    .empty-tab { text-align: center; color: rgba(0,0,0,0.54); padding: 32px; }
    @media (max-width: 767px) {
      .page-header { flex-direction: column; }
      .actions { width: 100%; }
      .actions button { flex: 1; }
    }
  `]
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
