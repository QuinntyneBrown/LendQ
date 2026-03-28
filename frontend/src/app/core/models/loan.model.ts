import { UserSummary } from './user.model';

export interface LoanInput {
  borrower_id: string;
  description: string;
  principal_amount: string;
  currency: string;
  interest_rate_percent?: string;
  repayment_frequency: RepaymentFrequency;
  installment_count?: number;
  maturity_date?: string;
  start_date: string;
  notes?: string;
  custom_schedule?: CustomScheduleRow[];
}

export interface LoanUpdateInput extends LoanInput {
  expected_terms_version: number;
}

export type RepaymentFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
export type LoanStatus = 'ACTIVE' | 'PAUSED' | 'PAID_OFF' | 'OVERDUE' | 'DEFAULTED';

export interface CustomScheduleRow {
  due_date: string;
  amount_due: string;
}

export interface LoanSummary {
  id: string;
  description: string;
  counterparty_name: string;
  principal_amount: string;
  outstanding_balance: string;
  next_due_date: string | null;
  status: LoanStatus;
}

export interface LoanTermsVersion {
  version: number;
  effective_at: string;
  reason: string;
  principal_amount?: string;
  currency?: string;
  interest_rate_percent?: string;
  repayment_frequency?: string;
  installment_count?: number | null;
  maturity_date?: string | null;
}

export interface ScheduleInstallment {
  id: string;
  sequence: number;
  due_date: string;
  amount_due: string;
  amount_paid: string;
  status: 'SCHEDULED' | 'PARTIAL' | 'PAID' | 'PAUSED' | 'RESCHEDULED' | 'OVERDUE';
  original_due_date?: string | null;
}

export interface ScheduleVersion {
  version: number;
  effective_at: string;
  installments: ScheduleInstallment[];
}

export interface LoanDetail extends LoanSummary {
  borrower: UserSummary;
  creditor: UserSummary;
  current_terms_version: LoanTermsVersion;
  current_schedule_version: ScheduleVersion;
}

export interface LoanChangeRequest {
  id: string;
  type: 'TERM_CHANGE' | 'RESCHEDULE' | 'PAUSE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: UserSummary;
  created_at: string;
  reason: string;
  proposed_terms?: Record<string, unknown>;
}
