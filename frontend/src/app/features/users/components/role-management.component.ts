import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { Role } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatChipsModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <h1>Role Management</h1>

      @if (roles$ | async; as roles) {
        @for (role of roles; track role.key) {
          <mat-card class="role-card">
            <mat-card-header>
              <mat-card-title>{{ role.label }}</mat-card-title>
              <mat-card-subtitle>{{ role.key }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="permissions">
                @for (perm of role.permissions; track perm) {
                  <mat-chip>{{ perm }}</mat-chip>
                }
                @if (role.permissions.length === 0) {
                  <span class="no-perms">No permissions assigned</span>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      } @else {
        <app-loading-spinner></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .role-card { margin-bottom: 16px; }
    .permissions { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0; }
    .no-perms { color: rgba(0,0,0,0.38); font-style: italic; }
  `]
})
export class RoleManagementComponent implements OnInit {
  roles$!: Observable<Role[]>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.roles$ = this.userService.getRoles().pipe(map(r => r.items));
  }
}
