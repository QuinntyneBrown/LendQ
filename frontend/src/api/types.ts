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
  expires_in_seconds: number;
  csrf_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    email_verified: boolean;
  };
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

// Bank Account types
export type BankAccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";
export type BankTransactionDirection = "CREDIT" | "DEBIT";
export type BankTransactionEntryType = "MANUAL_DEPOSIT" | "MANUAL_WITHDRAWAL" | "RECURRING_DEPOSIT" | "REVERSAL" | "SAVINGS_CONTRIBUTION" | "SAVINGS_RELEASE";
export type RecurringDepositStatus = "ACTIVE" | "PAUSED" | "FAILED" | "COMPLETED" | "CANCELLED";

export interface BankAccount {
  id: string;
  user_id: string;
  currency: string;
  current_balance: number;
  status: BankAccountStatus;
  timezone: string;
  version: number;
  created_at: string;
  updated_at: string;
  user_name: string | null;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  direction: BankTransactionDirection;
  entry_type: BankTransactionEntryType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reason_code: string;
  initiated_by_user_id: string;
  description: string | null;
  correlation_id: string | null;
  created_at: string;
}

export interface RecurringDeposit {
  id: string;
  account_id: string;
  owner_user_id: string;
  amount: number;
  source_description: string;
  frequency: RepaymentFrequency;
  start_date: string;
  end_date: string | null;
  execution_time_local: string;
  timezone: string;
  status: RecurringDepositStatus;
  next_execution_at: string | null;
  last_failure_code: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

// Savings Goal types
export type SavingsGoalStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline: string | null;
  description: string | null;
  status: SavingsGoalStatus;
  version: number;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalEntry {
  id: string;
  goal_id: string;
  direction: "CREDIT" | "DEBIT";
  entry_type: "CONTRIBUTION" | "RELEASE" | "ADJUSTMENT";
  amount: number;
  bank_transaction_id: string;
  running_total: number;
  created_at: string;
}

// Recurring Loan types
export type RecurringLoanStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "SUSPENDED" | "COMPLETED" | "CANCELLED";

export interface RecurringLoan {
  id: string;
  creditor_id: string;
  borrower_id: string;
  creditor_name: string;
  borrower_name: string;
  recurrence_interval: RepaymentFrequency;
  start_date: string;
  end_date: string | null;
  max_occurrences: number | null;
  status: RecurringLoanStatus;
  total_generated: number;
  next_generation_at: string | null;
  last_failure_code: string | null;
  version: number;
  active_template_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringLoanTemplateVersion {
  id: string;
  recurring_loan_id: string;
  version_number: number;
  description_template: string;
  principal_amount: number;
  currency: string;
  interest_rate_percent: number | null;
  repayment_frequency: RepaymentFrequency;
  installment_count: number;
  timezone: string;
  allow_parallel_active_generated_loans: boolean;
  max_generated_loan_principal_exposure: number | null;
  created_at: string;
}

export interface GeneratedLoanRecord {
  id: string;
  recurring_loan_id: string;
  loan_id: string;
  template_version_id: string;
  scheduled_for_date: string;
  sequence: number;
  generated_at: string;
}
