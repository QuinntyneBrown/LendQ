import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-reverse-payment-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule, CurrencyFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reverse-payment-dialog.component.html',
  styleUrl: './reverse-payment-dialog.component.scss'
})
export class ReversePaymentDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<ReversePaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { paymentId: string; amount: string }
  ) {
    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.paymentService.reversePayment(this.data.paymentId, { reason: this.form.value.reason }).subscribe({
      next: (tx) => {
        this.loading = false;
        this.toast.success(`Payment reversed (ID: ${tx.id.substring(0, 8)})`);
        this.dialogRef.close(true);
      },
      error: () => { this.loading = false; this.toast.error('Failed to reverse payment'); }
    });
  }
}
