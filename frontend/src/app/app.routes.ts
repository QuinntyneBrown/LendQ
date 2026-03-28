import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // Public auth routes
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/components/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/components/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/components/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./features/auth/components/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/components/verify-email.component').then(m => m.VerifyEmailComponent)
  },

  // Authenticated routes within main layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes)
      },
      {
        path: 'loans',
        canActivate: [roleGuard('CREDITOR', 'BORROWER')],
        loadChildren: () => import('./features/loans/loans.routes').then(m => m.loanRoutes)
      },
      {
        path: 'loans/:id/payments',
        canActivate: [roleGuard('CREDITOR', 'BORROWER')],
        loadChildren: () => import('./features/payments/payments.routes').then(m => m.paymentRoutes)
      },
      {
        path: 'users',
        canActivate: [roleGuard('ADMIN')],
        loadChildren: () => import('./features/users/users.routes').then(m => m.userRoutes)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.notificationRoutes)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.settingsRoutes)
      },
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'login' }
];
