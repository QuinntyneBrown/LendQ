import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map, BehaviorSubject, combineLatest } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { UserSummary } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { AddEditUserDialogComponent } from './add-edit-user-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatProgressSpinnerModule, LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Users</h1>
        <button mat-flat-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon> Add User
        </button>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search users</mat-label>
        <input matInput (input)="onSearch($event)" placeholder="Search by name or email">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      @if (filteredUsers$ | async; as users) {
        <!-- Desktop table -->
        <div class="desktop-only">
          <table mat-table [dataSource]="users" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let user">{{ user.name }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>
            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let user">
                @for (role of user.roles; track role) {
                  <mat-chip>{{ role }}</mat-chip>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let user">
                <span [class]="'status-' + user.status.toLowerCase()">{{ user.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button (click)="openEditDialog(user)" aria-label="Edit user">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="confirmDeactivate(user)" aria-label="Deactivate user"
                        [disabled]="user.status === 'INACTIVE'">
                  <mat-icon>block</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="mobile-only">
          @for (user of users; track user.id) {
            <mat-card class="user-card">
              <mat-card-header>
                <mat-card-title>{{ user.name }}</mat-card-title>
                <mat-card-subtitle>{{ user.email }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="card-row">
                  <span>Roles</span>
                  <span>
                    @for (role of user.roles; track role) { <mat-chip>{{ role }}</mat-chip> }
                  </span>
                </div>
                <div class="card-row">
                  <span>Status</span>
                  <span [class]="'status-' + user.status.toLowerCase()">{{ user.status }}</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button (click)="openEditDialog(user)">Edit</button>
                <button mat-button color="warn" (click)="confirmDeactivate(user)" [disabled]="user.status === 'INACTIVE'">Deactivate</button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      } @else {
        <app-loading-spinner></app-loading-spinner>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .user-card { margin-bottom: 12px; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .card-row span:first-child { color: rgba(0,0,0,0.54); }
  `]
})
export class UserListComponent implements OnInit {
  displayedColumns = ['name', 'email', 'roles', 'status', 'actions'];
  private users$ = new BehaviorSubject<UserSummary[]>([]);
  private search$ = new BehaviorSubject<string>('');
  filteredUsers$!: Observable<UserSummary[]>;
  loading = true;

  constructor(private userService: UserService, private dialog: MatDialog, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.filteredUsers$ = combineLatest([this.users$, this.search$]).pipe(
      map(([users, term]) => {
        if (!term) return users;
        return users.filter(u =>
          u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
        );
      })
    );
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: res => { this.users$.next(res.items); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value.toLowerCase());
  }

  openAddDialog(): void {
    this.dialog.open(AddEditUserDialogComponent, { width: '500px', data: {} })
      .afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  openEditDialog(user: UserSummary): void {
    this.dialog.open(AddEditUserDialogComponent, { width: '500px', data: { user } })
      .afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  confirmDeactivate(user: UserSummary): void {
    const data: ConfirmDialogData = {
      title: 'Deactivate User',
      message: `Are you sure you want to deactivate ${user.name}? Their active sessions will be revoked and access will be removed, but historical records are preserved.`,
      confirmText: 'Deactivate',
      isDestructive: true,
    };
    this.dialog.open(ConfirmDialogComponent, { width: '400px', data })
      .afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.userService.updateUser(user.id, { status: 'INACTIVE' } as any).subscribe({
            next: () => { this.toast.success('User deactivated'); this.loadUsers(); },
            error: () => this.toast.error('Failed to deactivate user')
          });
        }
      });
  }
}
