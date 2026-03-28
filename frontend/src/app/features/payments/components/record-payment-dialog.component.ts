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
  template: `
    <h2 mat-dialog-title>Record Payment</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Amount</mat-label>
          <input matInput formControlName="amount" type="number" min="0" step="0.01">
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Payment Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="posted_at">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Payment Method</mat-label>
          <mat-select formControlName="payment_method">
            <mat-option value="CASH">Cash</mat-option>
            <mat-option value="BANK_TRANSFER">Bank Transfer</mat-option>
            <mat-option value="CARD">Card</mat-option>
            <mat-option value="OTHER">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="loading || form.invalid" (click)="onSubmit()">
        @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Record Payment }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-field-full { width: 100%; }`]
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
