import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../models/user.model';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuth => isAuth || router.createUrlTree(['/login']))
  );
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuth => !isAuth || router.createUrlTree(['/dashboard']))
  );
};

export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if (authService.hasAnyRole(roles)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
}
