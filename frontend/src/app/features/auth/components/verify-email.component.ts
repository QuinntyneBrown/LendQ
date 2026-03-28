import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-content class="center-content">
          @if (loading) {
            <mat-spinner diameter="48"></mat-spinner>
            <p>Verifying your email...</p>
          } @else if (verified) {
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h2>Email Verified!</h2>
            <p>Your email has been verified. You can now sign in.</p>
            <a mat-flat-button color="primary" routerLink="/login">Sign In</a>
          } @else {
            <mat-icon class="error-icon">error</mat-icon>
            <h2>Verification Failed</h2>
            <p>{{ errorMessage }}</p>
            <a mat-flat-button color="primary" routerLink="/login">Back to Sign In</a>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; padding: 16px; }
    .auth-card { max-width: 420px; width: 100%; padding: 24px; }
    .center-content { text-align: center; padding: 24px 0; }
    .success-icon { font-size: 64px; width: 64px; height: 64px; color: #2e7d32; }
    .error-icon { font-size: 64px; width: 64px; height: 64px; color: #c62828; }
    h2 { margin: 16px 0 8px; }
    p { color: rgba(0,0,0,0.54); margin-bottom: 24px; }
  `]
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  verified = false;
  errorMessage = 'The verification link is invalid or has expired.';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token) {
      this.loading = false;
      return;
    }
    this.authService.confirmEmail(token).subscribe({
      next: () => { this.loading = false; this.verified = true; },
      error: () => { this.loading = false; }
    });
  }
}
