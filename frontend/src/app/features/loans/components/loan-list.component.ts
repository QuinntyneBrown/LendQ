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
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss'
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
