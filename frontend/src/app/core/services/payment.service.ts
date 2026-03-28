import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PaymentTransaction, RecordPaymentRequest,
  ReversalRequest, ScheduleAdjustmentRequest
} from '../models/payment.model';
import { ScheduleVersion } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  getSchedule(loanId: string): Observable<ScheduleVersion> {
    return this.http.get<ScheduleVersion>(`/api/v1/loans/${loanId}/schedule`);
  }

  getPayments(loanId: string): Observable<{ items: PaymentTransaction[] }> {
    return this.http.get<{ items: PaymentTransaction[] }>(`/api/v1/loans/${loanId}/payments`);
  }

  recordPayment(loanId: string, data: RecordPaymentRequest): Observable<PaymentTransaction> {
    const idempotencyKey = crypto.randomUUID();
    return this.http.post<PaymentTransaction>(
      `/api/v1/loans/${loanId}/payments`, data,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
  }

  reversePayment(paymentId: string, data: ReversalRequest): Observable<PaymentTransaction> {
    const idempotencyKey = crypto.randomUUID();
    return this.http.post<PaymentTransaction>(
      `/api/v1/payments/${paymentId}/reversals`, data,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
  }

  reschedule(loanId: string, data: ScheduleAdjustmentRequest): Observable<void> {
    return this.http.post<void>(`/api/v1/loans/${loanId}/schedule-adjustments/reschedule`, data);
  }

  pause(loanId: string, data: ScheduleAdjustmentRequest): Observable<void> {
    return this.http.post<void>(`/api/v1/loans/${loanId}/schedule-adjustments/pause`, data);
  }

  getHistory(loanId: string): Observable<{ items: unknown[] }> {
    return this.http.get<{ items: unknown[] }>(`/api/v1/loans/${loanId}/history`);
  }
}
