import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserSummary } from '../../../core/models/user.model';

@Component({
  selector: 'app-add-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit User' : 'Add User' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Roles</mat-label>
          <mat-select formControlName="roles" multiple>
            <mat-option value="ADMIN">Admin</mat-option>
            <mat-option value="CREDITOR">Creditor</mat-option>
            <mat-option value="BORROWER">Borrower</mat-option>
          </mat-select>
        </mat-form-field>

        @if (isEdit) {
          <mat-slide-toggle formControlName="is_active">Active</mat-slide-toggle>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="loading || form.invalid" (click)="onSave()">
        @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-field-full { width: 100%; }`]
})
export class AddEditUserDialogComponent {
  form: FormGroup;
  isEdit: boolean;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<AddEditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user?: UserSummary }
  ) {
    this.isEdit = !!data?.user;
    const user = data?.user;
    this.form = this.fb.group({
      name: [user?.name || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
      roles: [user?.roles || [], Validators.required],
      is_active: [user ? user.status === 'ACTIVE' : true],
    });
  }

  onSave(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const val = this.form.value;

    if (this.isEdit) {
      const update: any = {
        name: val.name,
        email: val.email,
        roles: val.roles,
        status: val.is_active ? 'ACTIVE' : 'INACTIVE',
      };
      this.userService.updateUser(this.data.user!.id, update).subscribe({
        next: () => { this.loading = false; this.toast.success('User updated'); this.dialogRef.close(true); },
        error: () => { this.loading = false; this.toast.error('Failed to update user'); }
      });
    } else {
      this.userService.createUser({ name: val.name, email: val.email, roles: val.roles } as any).subscribe({
        next: () => { this.loading = false; this.toast.success('User created'); this.dialogRef.close(true); },
        error: () => { this.loading = false; this.toast.error('Failed to create user'); }
      });
    }
  }
}
