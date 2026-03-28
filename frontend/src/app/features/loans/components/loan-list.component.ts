import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LoanSummary } from '../../../core/models/loan.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, CurrencyFormatPipe, LoadingSpinnerComponent, EmptyStateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Loans</h1>
        @if (authService.hasRole('CREDITOR')) {
          <button mat-flat-button color="primary" routerLink="/loans/new">
            <mat-icon>add</mat-icon> Create New Loan
          </button>
        }
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search loans</mat-label>
        <input matInput (input)="onSearch($event)" placeholder="Search by description or name">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      @if (loans$ | async; as loans) {
        @if (loans.length === 0) {
          <app-empty-state icon="account_balance" title="No loans yet"
                           message="Loans you create or are assigned to will appear here.">
          </app-empty-state>
        } @else {
          <!-- Desktop table -->
          <div class="desktop-only">
            <table mat-table [dataSource]="filteredLoans(loans)" class="full-width">
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let loan">{{ loan.description }}</td>
              </ng-container>
              <ng-container matColumnDef="counterparty">
                <th mat-header-cell *matHeaderCellDef>Counterparty</th>
                <td mat-cell *matCellDef="let loan">{{ loan.counterparty_name }}</td>
              </ng-container>
              <ng-container matColumnDef="principal">
                <th mat-header-cell *matHeaderCellDef>Principal</th>
                <td mat-cell *matCellDef="let loan">{{ loan.principal_amount | currencyFormat }}</td>
              </ng-container>
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef>Balance</th>
                <td mat-cell *matCellDef="let loan">{{ loan.outstanding_balance | currencyFormat }}</td>
              </ng-container>
              <ng-container matColumnDef="nextDue">
                <th mat-header-cell *matHeaderCellDef>Next Due</th>
                <td mat-cell *matCellDef="let loan">{{ loan.next_due_date || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let loan">
                  <mat-chip [class]="'status-' + loan.status.toLowerCase()">{{ loan.status }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let loan">
                  <button mat-icon-button [routerLink]="['/loans', loan.id]" aria-label="View loan">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"
                  [routerLink]="['/loans', row.id]"></tr>
            </table>
          </div>

          <!-- Mobile cards -->
          <div class="mobile-only">
            @for (loan of filteredLoans(loans); track loan.id) {
              <mat-card class="loan-card" [routerLink]="['/loans', loan.id]">
                <mat-card-header>
                  <mat-card-title>{{ loan.description }}</mat-card-title>
                  <mat-card-subtitle>{{ loan.counterparty_name }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="card-row">
                    <span>Balance</span>
                    <strong>{{ loan.outstanding_balance | currencyFormat }}</strong>
                  </div>
                  <div class="card-row">
                    <span>Next Due</span>
                    <span>{{ loan.next_due_date || '—' }}</span>
                  </div>
                  <mat-chip [class]="'status-' + loan.status.toLowerCase()">{{ loan.status }}</mat-chip>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      } @else {
        <app-loading-spinner></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,0.04); }
    .loan-card { margin-bottom: 12px; cursor: pointer; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .card-row span { color: rgba(0,0,0,0.54); }
  `]
})
export class LoanListComponent implements OnInit {
  loans$!: Observable<LoanSummary[]>;
  displayedColumns = ['description', 'counterparty', 'principal', 'balance', 'nextDue', 'status', 'actions'];
  searchTerm = '';

  constructor(private loanService: LoanService, public authService: AuthService) {}

  ngOnInit(): void {
    this.loans$ = this.loanService.getLoans().pipe(map(r => r.items));
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
  }

  filteredLoans(loans: LoanSummary[]): LoanSummary[] {
    if (!this.searchTerm) return loans;
    return loans.filter(l =>
      l.description.toLowerCase().includes(this.searchTerm) ||
      l.counterparty_name.toLowerCase().includes(this.searchTerm)
    );
  }
}
