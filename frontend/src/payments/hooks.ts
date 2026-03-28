import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/api/client";
import type { Payment, ChangeLog } from "@/api/types";
import type { RecordPaymentFormData, RescheduleFormData, PauseFormData } from "./schemas";
import { STALE_TIME } from "@/utils/constants";

export function usePaymentSchedule(loanId: string) {
  return useQuery({
    queryKey: ["payments", loanId],
    queryFn: () => apiGet<Payment[]>(`/loans/${loanId}/schedule`),
    staleTime: STALE_TIME,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; loanId: string; data: RecordPaymentFormData }) =>
      apiPost<Payment>(`/payments/${paymentId}/record`, data),
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
