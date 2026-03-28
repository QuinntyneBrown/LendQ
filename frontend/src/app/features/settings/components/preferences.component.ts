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
  template: `
    <div class="page-container">
      <h1>Notification Preferences</h1>
      <p class="hint">In-app notifications are always enabled. Toggle email delivery per category below.</p>

      @if (form) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form">
              <div class="pref-row">
                <div class="pref-info">
                  <strong>Payment Due</strong>
                  <span>Email reminder when a payment is approaching</span>
                </div>
                <mat-slide-toggle formControlName="payment_due_email"></mat-slide-toggle>
              </div>
              <div class="pref-row">
                <div class="pref-info">
                  <strong>Payment Overdue</strong>
                  <span>Email alert when a payment is past due</span>
                </div>
                <mat-slide-toggle formControlName="payment_overdue_email"></mat-slide-toggle>
              </div>
              <div class="pref-row">
                <div class="pref-info">
                  <strong>Payment Received</strong>
                  <span>Email confirmation when a payment is recorded</span>
                </div>
                <mat-slide-toggle formControlName="payment_received_email"></mat-slide-toggle>
              </div>
              <div class="pref-row">
                <div class="pref-info">
                  <strong>Schedule Changed</strong>
                  <span>Email when a payment schedule is modified</span>
                </div>
                <mat-slide-toggle formControlName="schedule_changed_email"></mat-slide-toggle>
              </div>
              <div class="pref-row">
                <div class="pref-info">
                  <strong>Loan Modified</strong>
                  <span>Email when loan terms are updated</span>
                </div>
                <mat-slide-toggle formControlName="loan_modified_email"></mat-slide-toggle>
              </div>
              <div class="pref-row">
                <div class="pref-info">
                  <strong>System Notifications</strong>
                  <span>Email for system-level announcements</span>
                </div>
                <mat-slide-toggle formControlName="system_email"></mat-slide-toggle>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        @if (isDirty) {
          <div class="save-bar">
            <span>You have unsaved changes</span>
            <button mat-flat-button color="primary" [disabled]="saving" (click)="save()">
              @if (saving) { <mat-spinner diameter="20"></mat-spinner> } @else { Save Preferences }
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .hint { color: rgba(0,0,0,0.54); margin-bottom: 24px; }
    .pref-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .pref-info { display: flex; flex-direction: column; }
    .pref-info strong { margin-bottom: 2px; }
    .pref-info span { font-size: 13px; color: rgba(0,0,0,0.54); }
    .save-bar {
      position: sticky; bottom: 0; background: #fff3e0; padding: 12px 24px;
      display: flex; justify-content: space-between; align-items: center;
      border-radius: 4px; margin-top: 16px;
    }
  `]
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
