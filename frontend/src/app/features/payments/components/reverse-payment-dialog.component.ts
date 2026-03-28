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
  template: `
    <h2 mat-dialog-title>Reverse Payment</h2>
    <mat-dialog-content>
      <p>You are about to reverse a payment of <strong>{{ data.amount | currencyFormat }}</strong>.
         This will create a compensating transaction.</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Reason for reversal</mat-label>
          <textarea matInput formControlName="reason" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="warn" [disabled]="loading || form.invalid" (click)="onSubmit()">
        @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Reverse Payment }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-field-full { width: 100%; }`]
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
