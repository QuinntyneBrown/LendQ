import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoanService } from '../../../core/services/loan.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-loan-change-request-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-change-request-dialog.component.html',
  styleUrl: './loan-change-request-dialog.component.scss'
})
export class LoanChangeRequestDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<LoanChangeRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loanId: string }
  ) {
    this.form = this.fb.group({
      type: ['TERM_CHANGE', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.loanService.submitChangeRequest(this.data.loanId, this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Change request submitted');
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to submit change request');
      }
    });
  }
}
