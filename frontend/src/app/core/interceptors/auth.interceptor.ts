import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  let authReq = req;
  const token = authService.token;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        return authService.refresh().pipe(
          switchMap(bundle => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${bundle.access_token}` }
            });
            return next(retryReq);
          }),
          catchError(refreshError => throwError(() => refreshError))
        );
      }
      return throwError(() => error);
    })
  );
};
