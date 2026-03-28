import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-record-payment-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './record-payment-dialog.component.html',
  styleUrl: './record-payment-dialog.component.scss'
})
export class RecordPaymentDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<RecordPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loanId: string }
  ) {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      posted_at: [new Date(), Validators.required],
      payment_method: ['', Validators.required],
      notes: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const val = this.form.value;
    this.paymentService.recordPayment(this.data.loanId, {
      amount: String(val.amount),
      posted_at: new Date(val.posted_at).toISOString(),
      payment_method: val.payment_method,
      notes: val.notes || undefined,
    }).subscribe({
      next: (tx) => {
        this.loading = false;
        this.toast.success(`Payment recorded (ID: ${tx.id.substring(0, 8)})`);
        this.dialogRef.close(true);
      },
      error: () => { this.loading = false; this.toast.error('Failed to record payment'); }
    });
  }
}
