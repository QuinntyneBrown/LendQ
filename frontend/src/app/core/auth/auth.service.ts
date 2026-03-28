import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { AuthTokenBundle, UserSummary, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<UserSummary | null>(null);
  private accessToken: string | null = null;
  private refreshInFlight$: Observable<AuthTokenBundle> | null = null;

  user$ = this.userSubject.asObservable();
  isAuthenticated$ = this.user$.pipe(map(u => !!u));

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): UserSummary | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.accessToken;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  login(email: string, password: string): Observable<AuthTokenBundle> {
    return this.http.post<AuthTokenBundle>('/api/v1/auth/login', { email, password }).pipe(
      tap(bundle => this.setSession(bundle))
    );
  }

  signup(name: string, email: string, password: string, confirm_password: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/signup', { name, email, password, confirm_password });
  }

  tryRefresh(): Observable<boolean> {
    return this.refresh().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  refresh(): Observable<AuthTokenBundle> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<AuthTokenBundle>('/api/v1/auth/refresh', {}).pipe(
        tap(bundle => this.setSession(bundle)),
        shareReplay(1),
        tap({ complete: () => (this.refreshInFlight$ = null), error: () => (this.refreshInFlight$ = null) })
      );
    }
    return this.refreshInFlight$;
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/v1/auth/logout', {}).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      })
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string, confirm_password: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/reset-password', { token, password, confirm_password });
  }

  resendVerification(email: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/email-verification/resend', { email });
  }

  confirmEmail(token: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/email-verification/confirm', { token });
  }

  private setSession(bundle: AuthTokenBundle): void {
    this.accessToken = bundle.access_token;
    this.userSubject.next(bundle.user);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.userSubject.next(null);
  }
}
