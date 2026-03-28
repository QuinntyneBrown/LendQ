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
  templateUrl: './create-edit-loan-dialog.component.html',
  styleUrl: './create-edit-loan-dialog.component.scss'
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
