import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reschedule-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reschedule-dialog.component.html',
  styleUrl: './reschedule-dialog.component.scss'
})
export class RescheduleDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<RescheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loanId: string }
  ) {
    this.form = this.fb.group({
      new_due_date: [null, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const val = this.form.value;
    this.paymentService.reschedule(this.data.loanId, {
      installment_ids: [],
      new_due_date: new Date(val.new_due_date).toISOString().split('T')[0],
      reason: val.reason,
    }).subscribe({
      next: () => { this.loading = false; this.toast.success('Payment rescheduled'); this.dialogRef.close(true); },
      error: () => { this.loading = false; this.toast.error('Failed to reschedule'); }
    });
  }
}
