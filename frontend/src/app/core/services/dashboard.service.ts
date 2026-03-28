import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { DashboardSummary, ActivityItem } from '../models/dashboard.model';
import { LoanSummary } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary | null> {
    return this.http.get<DashboardSummary>('/api/v1/dashboard/summary').pipe(
      catchError(() => of(null))
    );
  }

  getLoans(): Observable<{ items: LoanSummary[] } | null> {
    return this.http.get<{ items: LoanSummary[] }>('/api/v1/dashboard/loans').pipe(
      catchError(() => of(null))
    );
  }

  getActivity(): Observable<{ items: ActivityItem[] } | null> {
    return this.http.get<{ items: ActivityItem[] }>('/api/v1/dashboard/activity').pipe(
      catchError(() => of(null))
    );
  }
}
