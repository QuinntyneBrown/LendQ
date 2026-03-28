export type NotificationType =
  | 'PAYMENT_DUE'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_RECEIVED'
  | 'SCHEDULE_CHANGED'
  | 'LOAN_MODIFIED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  related_loan_id?: string | null;
}

export interface NotificationPreferences {
  payment_due_email: boolean;
  payment_overdue_email: boolean;
  payment_received_email: boolean;
  schedule_changed_email: boolean;
  loan_modified_email: boolean;
  system_email: boolean;
}
