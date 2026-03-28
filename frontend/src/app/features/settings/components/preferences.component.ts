import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationPreferences } from '../../../core/models/notification.model';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatSlideToggleModule, MatButtonModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss'
})
export class PreferencesComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  isDirty = false;
  private originalValues!: NotificationPreferences;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.notificationService.getPreferences().subscribe(prefs => {
      this.originalValues = { ...prefs };
      this.form = this.fb.group({
        payment_due_email: [prefs.payment_due_email],
        payment_overdue_email: [prefs.payment_overdue_email],
        payment_received_email: [prefs.payment_received_email],
        schedule_changed_email: [prefs.schedule_changed_email],
        loan_modified_email: [prefs.loan_modified_email],
        system_email: [prefs.system_email],
      });
      this.form.valueChanges.subscribe(val => {
        this.isDirty = JSON.stringify(val) !== JSON.stringify(this.originalValues);
      });
    });
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    this.notificationService.updatePreferences(this.form.value).subscribe({
      next: (updated) => {
        this.saving = false;
        this.originalValues = { ...updated };
        this.isDirty = false;
        this.toast.success('Preferences saved');
      },
      error: () => { this.saving = false; this.toast.error('Failed to save preferences'); }
    });
  }
}
