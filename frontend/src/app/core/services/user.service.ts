import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSummary, Role, BorrowerDirectoryItem } from '../models/user.model';
import { PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<PaginatedResponse<UserSummary>> {
    return this.http.get<PaginatedResponse<UserSummary>>('/api/v1/users');
  }

  getUser(id: string): Observable<UserSummary> {
    return this.http.get<UserSummary>(`/api/v1/users/${id}`);
  }

  createUser(data: Partial<UserSummary>): Observable<UserSummary> {
    return this.http.post<UserSummary>('/api/v1/users', data);
  }

  updateUser(id: string, data: Partial<UserSummary>): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`/api/v1/users/${id}`, data);
  }

  getRoles(): Observable<PaginatedResponse<Role>> {
    return this.http.get<PaginatedResponse<Role>>('/api/v1/roles');
  }

  updateRolePermissions(roleKey: string, permissions: string[]): Observable<Role> {
    return this.http.put<Role>(`/api/v1/roles/${roleKey}/permissions`, { permissions });
  }

  searchBorrowers(query?: string): Observable<PaginatedResponse<BorrowerDirectoryItem>> {
    let params: Record<string, string> = {};
    if (query) { params = { q: query }; }
    return this.http.get<PaginatedResponse<BorrowerDirectoryItem>>('/api/v1/users/borrowers', { params });
  }

  getAuditEvents(params?: Record<string, string>): Observable<{ items: unknown[] }> {
    return this.http.get<{ items: unknown[] }>('/api/v1/admin/audit-events', { params });
  }
}
