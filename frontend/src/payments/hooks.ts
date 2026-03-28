import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/api/client";
import type { Payment, ChangeLog } from "@/api/types";
import type { RecordPaymentFormData, RescheduleFormData, PauseFormData } from "./schemas";
import { STALE_TIME } from "@/utils/constants";

type PaymentResponse = Omit<Payment, "amount_due" | "amount_paid"> & {
  amount_due: number | string;
  amount_paid: number | string;
};

function normalizePayment(payment: PaymentResponse): Payment {
  return {
    ...payment,
    amount_due: Number(payment.amount_due),
    amount_paid: Number(payment.amount_paid),
  };
}

function buildIdempotencyKey(loanId: string) {
  return `web-${loanId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function usePaymentSchedule(loanId: string) {
  return useQuery({
    queryKey: ["payments", loanId],
    queryFn: () =>
      apiGet<PaymentResponse[]>(`/loans/${loanId}/schedule`).then((payments) =>
        payments.map(normalizePayment),
      ),
    staleTime: STALE_TIME,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      loanId,
      data,
    }: {
      paymentId: string;
      loanId: string;
      data: RecordPaymentFormData;
    }) =>
      apiPost<{ message: string }>(
        `/loans/${loanId}/payments`,
        {
          amount: data.amount,
          paid_date: data.date,
          ...(data.notes ? { notes: data.notes } : {}),
        },
        {
          headers: {
            "Idempotency-Key": buildIdempotencyKey(loanId),
          },
        },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["loans", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useReschedulePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; loanId: string; data: RescheduleFormData }) =>
      apiPut<Payment>(`/payments/${paymentId}/reschedule`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["loans", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function usePausePayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: PauseFormData }) =>
      apiPost<Payment[]>(`/loans/${loanId}/pause`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["loans", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function usePaymentHistory(loanId: string) {
  return useQuery({
    queryKey: ["history", loanId],
    queryFn: () => apiGet<ChangeLog[]>(`/loans/${loanId}/history`),
    staleTime: STALE_TIME,
  });
}
