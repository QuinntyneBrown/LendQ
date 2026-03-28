import { HttpInterceptorFn } from '@angular/common/http';

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const requestId = crypto.randomUUID();
  const cloned = req.clone({
    setHeaders: { 'X-Request-ID': requestId }
  });
  return next(cloned);
};
