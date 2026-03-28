import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title><h1 class="brand-title">LendQ</h1></mat-card-title>
          <mat-card-subtitle>Reset your password</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (submitted) {
            <div class="success-banner">
              If an account exists for this email, a reset link has been sent. Check your inbox.
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" autocomplete="email">
              </mat-form-field>
              <button mat-flat-button color="primary" type="submit" class="form-field-full submit-btn"
                      [disabled]="loading || form.invalid">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Send Reset Link
                }
              </button>
            </form>
          }
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Back to Sign In</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh; background: #f5f5f5; padding: 16px;
    }
    .auth-card { max-width: 420px; width: 100%; padding: 24px; }
    .brand-title { text-align: center; color: #1565c0; font-size: 28px; margin: 0 0 8px; }
    mat-card-header { justify-content: center; margin-bottom: 16px; }
    mat-card-subtitle { text-align: center; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .success-banner { background: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 4px; text-align: center; }
  `]
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  submitted = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => { this.loading = false; this.submitted = true; },
      error: () => { this.loading = false; this.submitted = true; }
    });
  }
}
