import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionSummary } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  constructor(private http: HttpClient) {}

  getSessions(): Observable<{ items: SessionSummary[] }> {
    return this.http.get<{ items: SessionSummary[] }>('/api/v1/auth/sessions');
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/auth/sessions/${sessionId}`);
  }

  logoutAll(): Observable<void> {
    return this.http.post<void>('/api/v1/auth/logout-all', {});
  }
}
