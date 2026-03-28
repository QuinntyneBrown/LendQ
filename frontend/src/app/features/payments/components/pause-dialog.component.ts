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

@Component({
  selector: 'app-pause-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pause-dialog.component.html',
  styleUrl: './pause-dialog.component.scss'
})
export class PauseDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<PauseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loanId: string }
  ) {
    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.paymentService.pause(this.data.loanId, {
      installment_ids: [],
      reason: this.form.value.reason,
    }).subscribe({
      next: () => { this.loading = false; this.toast.success('Payments paused'); this.dialogRef.close(true); },
      error: () => { this.loading = false; this.toast.error('Failed to pause payments'); }
    });
  }
}
