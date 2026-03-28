import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, debounceTime, switchMap, of, startWith } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoanInput } from '../../../core/models/loan.model';
import { BorrowerDirectoryItem } from '../../../core/models/user.model';

@Component({
  selector: 'app-create-loan',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatButtonModule, MatIconModule, MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/loans" aria-label="Back"><mat-icon>arrow_back</mat-icon></button>
        <h1>Create New Loan</h1>
      </div>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Borrower</mat-label>
              <input matInput formControlName="borrower_search" [matAutocomplete]="auto" placeholder="Search by name or email...">
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onBorrowerSelected($event)">
                @for (b of filteredBorrowers$ | async; track b.id) {
                  <mat-option [value]="b">{{ b.name }} ({{ b.email }})</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" maxlength="500">
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Principal Amount</mat-label>
                <input matInput formControlName="principal_amount" type="number" min="0" step="0.01">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Currency</mat-label>
                <input matInput formControlName="currency" maxlength="3" placeholder="USD">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Interest Rate %</mat-label>
                <input matInput formControlName="interest_rate_percent" type="number" min="0" step="0.01">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Repayment Frequency</mat-label>
                <mat-select formControlName="repayment_frequency">
                  <mat-option value="WEEKLY">Weekly</mat-option>
                  <mat-option value="BIWEEKLY">Bi-weekly</mat-option>
                  <mat-option value="MONTHLY">Monthly</mat-option>
                  <mat-option value="CUSTOM">Custom</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Installment Count</mat-label>
                <input matInput formControlName="installment_count" type="number" min="1">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Maturity Date</mat-label>
                <input matInput [matDatepicker]="maturityPicker" formControlName="maturity_date">
                <mat-datepicker-toggle matSuffix [for]="maturityPicker"></mat-datepicker-toggle>
                <mat-datepicker #maturityPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="start_date">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>

            @if (form.get('repayment_frequency')?.value === 'CUSTOM') {
              <h3>Custom Schedule</h3>
              <div formArrayName="custom_schedule">
                @for (row of customSchedule.controls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Due Date</mat-label>
                      <input matInput [matDatepicker]="dp" formControlName="due_date">
                      <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
                      <mat-datepicker #dp></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Amount</mat-label>
                      <input matInput formControlName="amount_due" type="number" min="0" step="0.01">
                    </mat-form-field>
                    <button mat-icon-button color="warn" type="button" (click)="removeScheduleRow(i)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
              <button mat-stroked-button type="button" (click)="addScheduleRow()">
                <mat-icon>add</mat-icon> Add Row
              </button>
            }

            <div class="form-actions">
              <button mat-button type="button" routerLink="/loans">Cancel</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="loading || form.invalid">
                @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Create Loan }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .form-field-full { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
    @media (max-width: 599px) { .form-row { flex-direction: column; gap: 0; } }
  `]
})
export class CreateLoanComponent implements OnInit {
  form: FormGroup;
  loading = false;
  filteredBorrowers$!: Observable<BorrowerDirectoryItem[]>;

  constructor(
    private fb: FormBuilder, private loanService: LoanService,
    private userService: UserService, private toast: ToastService, private router: Router
  ) {
    this.form = this.fb.group({
      borrower_search: [''],
      borrower_id: ['', Validators.required],
      description: ['', Validators.required],
      principal_amount: ['', Validators.required],
      currency: ['USD', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      interest_rate_percent: [''],
      repayment_frequency: ['MONTHLY', Validators.required],
      installment_count: [null],
      maturity_date: [null],
      start_date: [null, Validators.required],
      notes: [''],
      custom_schedule: this.fb.array([]),
    });
  }

  get customSchedule(): FormArray {
    return this.form.get('custom_schedule') as FormArray;
  }

  ngOnInit(): void {
    const searchCtrl = this.form.get('borrower_search')!;
    this.filteredBorrowers$ = searchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(val => {
        const term = typeof val === 'string' ? val : '';
        return term.length >= 2 ? this.userService.searchBorrowers(term).pipe(switchMap(r => of(r.items))) : of([]);
      })
    );
  }

  onBorrowerSelected(event: any): void {
    const borrower: BorrowerDirectoryItem = event.option.value;
    this.form.patchValue({ borrower_id: borrower.id, borrower_search: `${borrower.name} (${borrower.email})` });
  }

  addScheduleRow(): void {
    this.customSchedule.push(this.fb.group({ due_date: ['', Validators.required], amount_due: ['', Validators.required] }));
  }

  removeScheduleRow(i: number): void { this.customSchedule.removeAt(i); }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const val = this.form.value;
    const data: LoanInput = {
      borrower_id: val.borrower_id,
      description: val.description,
      principal_amount: String(val.principal_amount),
      currency: val.currency,
      interest_rate_percent: val.interest_rate_percent ? String(val.interest_rate_percent) : undefined,
      repayment_frequency: val.repayment_frequency,
      installment_count: val.installment_count || undefined,
      maturity_date: val.maturity_date ? new Date(val.maturity_date).toISOString().split('T')[0] : undefined,
      start_date: new Date(val.start_date).toISOString().split('T')[0],
      notes: val.notes || undefined,
      custom_schedule: val.repayment_frequency === 'CUSTOM' ? val.custom_schedule : undefined,
    };
    this.loanService.createLoan(data).subscribe({
      next: (loan) => { this.loading = false; this.toast.success('Loan created'); this.router.navigate(['/loans', loan.id]); },
      error: () => { this.loading = false; this.toast.error('Failed to create loan'); }
    });
  }
}
