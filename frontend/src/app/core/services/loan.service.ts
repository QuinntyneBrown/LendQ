import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LoanSummary, LoanDetail, LoanInput, LoanUpdateInput,
  LoanTermsVersion, LoanChangeRequest
} from '../models/loan.model';
import { PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class LoanService {
  constructor(private http: HttpClient) {}

  getLoans(): Observable<PaginatedResponse<LoanSummary>> {
    return this.http.get<PaginatedResponse<LoanSummary>>('/api/v1/loans');
  }

  getLoan(id: string): Observable<LoanDetail> {
    return this.http.get<LoanDetail>(`/api/v1/loans/${id}`);
  }

  createLoan(data: LoanInput): Observable<LoanDetail> {
    return this.http.post<LoanDetail>('/api/v1/loans', data);
  }

  updateLoan(id: string, data: LoanUpdateInput): Observable<LoanDetail> {
    return this.http.patch<LoanDetail>(`/api/v1/loans/${id}`, data);
  }

  getTermsVersions(loanId: string): Observable<{ items: LoanTermsVersion[] }> {
    return this.http.get<{ items: LoanTermsVersion[] }>(`/api/v1/loans/${loanId}/terms-versions`);
  }

  getChangeRequests(loanId: string): Observable<PaginatedResponse<LoanChangeRequest>> {
    return this.http.get<PaginatedResponse<LoanChangeRequest>>(`/api/v1/loans/${loanId}/change-requests`);
  }

  submitChangeRequest(loanId: string, data: { type: string; reason: string; proposed_terms?: Record<string, unknown> }): Observable<LoanChangeRequest> {
    return this.http.post<LoanChangeRequest>(`/api/v1/loans/${loanId}/change-requests`, data);
  }

  approveChangeRequest(loanId: string, requestId: string): Observable<void> {
    return this.http.post<void>(`/api/v1/loans/${loanId}/change-requests/${requestId}/approve`, {});
  }

  rejectChangeRequest(loanId: string, requestId: string): Observable<void> {
    return this.http.post<void>(`/api/v1/loans/${loanId}/change-requests/${requestId}/reject`, {});
  }
}
