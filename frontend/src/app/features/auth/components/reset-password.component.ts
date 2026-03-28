import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title><h1 class="brand-title">LendQ</h1></mat-card-title>
          <mat-card-subtitle>Set a new password</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (errorMessage) {
            <div class="error-banner" role="alert">{{ errorMessage }}</div>
          }
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>New Password</mat-label>
              <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" autocomplete="new-password">
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Confirm Password</mat-label>
              <input matInput formControlName="confirm_password" [type]="hidePassword ? 'password' : 'text'" autocomplete="new-password">
              @if (form.hasError('passwordMismatch') && form.get('confirm_password')?.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" class="form-field-full submit-btn"
                    [disabled]="loading || form.invalid">
              @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Reset Password }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Back to Sign In</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; padding: 16px; }
    .auth-card { max-width: 420px; width: 100%; padding: 24px; }
    .brand-title { text-align: center; color: #1565c0; font-size: 28px; margin: 0 0 8px; }
    mat-card-header { justify-content: center; margin-bottom: 16px; }
    mat-card-subtitle { text-align: center; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .error-banner { background: #ffebee; color: #c62828; padding: 12px; border-radius: 4px; margin-bottom: 16px; text-align: center; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  hidePassword = true;
  private token = '';

  constructor(
    private fb: FormBuilder, private authService: AuthService,
    private route: ActivatedRoute, private router: Router, private toast: ToastService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    return control.get('password')?.value === control.get('confirm_password')?.value
      ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    const { password, confirm_password } = this.form.value;
    this.authService.resetPassword(this.token, password, confirm_password).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Password reset successfully. Please sign in.');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to reset password. The link may have expired.';
      }
    });
  }
}
