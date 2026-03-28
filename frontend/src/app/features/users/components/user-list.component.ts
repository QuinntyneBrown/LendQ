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
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
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
