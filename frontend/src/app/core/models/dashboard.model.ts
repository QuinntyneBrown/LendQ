export interface DashboardSummary {
  total_lent_out: string;
  total_owed: string;
  upcoming_payments_7d: number;
  overdue_payments: number;
  generated_at: string;
  projection_lag_seconds?: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  created_at: string;
  loan_id?: string | null;
}
