import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../../../core/models/api.model';

@Component({
  selector: 'app-signup',
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
          <mat-card-subtitle>Create your account</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (successMessage) {
            <div class="success-banner">{{ successMessage }}</div>
          }
          @if (errorMessage) {
            <div class="error-banner" role="alert">{{ errorMessage }}</div>
          }
          @if (!successMessage) {
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" autocomplete="name">
                @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" autocomplete="email">
                @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                  <mat-error>Enter a valid email</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" autocomplete="new-password">
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword" [attr.aria-label]="'Toggle password visibility'">
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
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Create Account
                }
              </button>
            </form>
          }
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Already have an account? Sign In</a>
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
    .error-banner { background: #ffebee; color: #c62828; padding: 12px; border-radius: 4px; margin-bottom: 16px; text-align: center; }
    .success-banner { background: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 4px; margin-bottom: 16px; text-align: center; }
  `]
})
export class SignupComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  hidePassword = true;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirm_password')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    const { name, email, password, confirm_password } = this.form.value;
    this.authService.signup(name, email, password, confirm_password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Account created! Please check your email to verify your account before signing in.';
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const body = err.error as ErrorResponse | undefined;
        this.errorMessage = body?.message || 'Unable to create account. Please try again.';
      }
    });
  }
}
