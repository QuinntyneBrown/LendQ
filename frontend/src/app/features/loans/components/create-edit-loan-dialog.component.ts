import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { LoanDetail, LoanInput, LoanUpdateInput } from '../../../core/models/loan.model';
import { BorrowerDirectoryItem } from '../../../core/models/user.model';

@Component({
  selector: 'app-create-edit-loan-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatAutocompleteModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Loan' : 'Create New Loan' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        @if (!isEdit) {
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Borrower</mat-label>
            <input matInput formControlName="borrower_search" [matAutocomplete]="auto" placeholder="Search borrower...">
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onBorrowerSelected($event)">
              @for (b of filteredBorrowers$ | async; track b.id) {
                <mat-option [value]="b">{{ b.name }} ({{ b.email }})</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
        }

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
          @for (row of customSchedule.controls; track $index; let i = $index) {
            <div class="form-row" [formGroupName]="'custom_schedule'">
              <div [formArrayName]="'custom_schedule'">
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
              </div>
            </div>
          }
          <button mat-stroked-button type="button" (click)="addScheduleRow()">
            <mat-icon>add</mat-icon> Add Row
          </button>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="loading || form.invalid" (click)="onSave()">
        @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .form-field-full { width: 100%; }
    @media (max-width: 599px) { .form-row { flex-direction: column; gap: 0; } }
  `]
})
export class CreateEditLoanDialogComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean;
  loading = false;
  filteredBorrowers$!: Observable<BorrowerDirectoryItem[]>;

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private userService: UserService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<CreateEditLoanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loan?: LoanDetail }
  ) {
    this.isEdit = !!data?.loan;
    const loan = data?.loan;
    this.form = this.fb.group({
      borrower_search: [''],
      borrower_id: [loan?.borrower?.id || '', this.isEdit ? [] : [Validators.required]],
      description: [loan?.description || '', Validators.required],
      principal_amount: [loan?.principal_amount || '', Validators.required],
      currency: [loan?.current_terms_version?.currency || 'USD', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      interest_rate_percent: [loan?.current_terms_version?.interest_rate_percent || ''],
      repayment_frequency: [loan?.current_terms_version?.repayment_frequency || 'MONTHLY', Validators.required],
      installment_count: [loan?.current_terms_version?.installment_count || null],
      maturity_date: [loan?.current_terms_version?.maturity_date || null],
      start_date: [null, this.isEdit ? [] : [Validators.required]],
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
    this.customSchedule.push(this.fb.group({
      due_date: ['', Validators.required],
      amount_due: ['', Validators.required],
    }));
  }

  removeScheduleRow(i: number): void {
    this.customSchedule.removeAt(i);
  }

  onSave(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;

    const val = this.form.value;
    const startDate = val.start_date ? new Date(val.start_date).toISOString().split('T')[0] : undefined;
    const maturityDate = val.maturity_date ? new Date(val.maturity_date).toISOString().split('T')[0] : undefined;

    if (this.isEdit) {
      const updateData: LoanUpdateInput = {
        borrower_id: this.data.loan!.borrower.id,
        description: val.description,
        principal_amount: String(val.principal_amount),
        currency: val.currency,
        interest_rate_percent: val.interest_rate_percent ? String(val.interest_rate_percent) : undefined,
        repayment_frequency: val.repayment_frequency,
        installment_count: val.installment_count || undefined,
        maturity_date: maturityDate,
        start_date: startDate || this.data.loan!.current_terms_version?.effective_at?.split('T')[0] || '',
        expected_terms_version: this.data.loan!.current_terms_version.version,
      };
      this.loanService.updateLoan(this.data.loan!.id, updateData).subscribe({
        next: () => { this.loading = false; this.toast.success('Loan updated'); this.dialogRef.close(true); },
        error: (err) => {
          this.loading = false;
          if (err.status === 409) {
            this.toast.error('Version conflict. Please refresh and try again.');
          } else {
            this.toast.error('Failed to update loan');
          }
        }
      });
    } else {
      const createData: LoanInput = {
        borrower_id: val.borrower_id,
        description: val.description,
        principal_amount: String(val.principal_amount),
        currency: val.currency,
        interest_rate_percent: val.interest_rate_percent ? String(val.interest_rate_percent) : undefined,
        repayment_frequency: val.repayment_frequency,
        installment_count: val.installment_count || undefined,
        maturity_date: maturityDate,
        start_date: startDate!,
        notes: val.notes || undefined,
        custom_schedule: val.repayment_frequency === 'CUSTOM' ? val.custom_schedule : undefined,
      };
      this.loanService.createLoan(createData).subscribe({
        next: () => { this.loading = false; this.toast.success('Loan created'); this.dialogRef.close(true); },
        error: () => { this.loading = false; this.toast.error('Failed to create loan'); }
      });
    }
  }
}
