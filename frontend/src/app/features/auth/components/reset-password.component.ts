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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
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
