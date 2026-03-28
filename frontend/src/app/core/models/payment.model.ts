export interface PaymentAllocation {
  installment_id: string;
  amount: string;
}

export interface PaymentTransaction {
  id: string;
  loan_id: string;
  amount: string;
  posted_at: string;
  payment_method: PaymentMethod;
  direction: 'CREDIT' | 'DEBIT';
  transaction_type: 'PAYMENT' | 'REVERSAL' | 'ADJUSTMENT';
  notes?: string;
  allocations?: PaymentAllocation[];
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';

export interface RecordPaymentRequest {
  amount: string;
  posted_at: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface ReversalRequest {
  reason: string;
}

export interface ScheduleAdjustmentRequest {
  installment_ids: string[];
  new_due_date?: string;
  reason: string;
  requested_mode?: 'DIRECT_APPLY' | 'REQUEST_APPROVAL';
}
