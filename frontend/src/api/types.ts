export type LoanStatus = "ACTIVE" | "PAUSED" | "PAID_OFF" | "OVERDUE" | "DEFAULTED";
export type PaymentStatus = "SCHEDULED" | "PAID" | "PAUSED" | "RESCHEDULED" | "OVERDUE" | "PARTIAL";
export type NotificationType = "PAYMENT_DUE" | "PAYMENT_OVERDUE" | "PAYMENT_RECEIVED" | "SCHEDULE_CHANGED" | "LOAN_MODIFIED" | "SYSTEM";
export type RepaymentFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";

export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  roles: Role[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: "Admin" | "Creditor" | "Borrower";
  description: string;
  permissions: string[];
}

export interface Loan {
  id: string;
  creditor_id: string;
  borrower_id: string;
  creditor_name: string;
  borrower_name: string;
  description: string;
  principal: number;
  interest_rate: number;
  repayment_frequency: RepaymentFrequency;
  start_date: string;
  status: LoanStatus;
  outstanding_balance: number;
  notes: string;
}

export interface Payment {
  id: string;
  loan_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  paid_date: string | null;
  original_due_date: string | null;
  status: PaymentStatus;
  notes: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  loan_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface DashboardSummary {
  total_lent_out: number;
  total_owed: number;
  upcoming_payments_7d: number;
  overdue_payments: number;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  loan_id: string | null;
  timestamp: string;
}

export interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
  reason: string;
}

export interface LoanSummary {
  id: string;
  person_name: string;
  amount: number;
  next_due: string;
  status: LoanStatus;
}
