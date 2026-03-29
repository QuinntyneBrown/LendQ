import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/api/client";
import type {
  RecurringLoan,
  RecurringLoanTemplateVersion,
  GeneratedLoanRecord,
  PaginatedResponse,
} from "@/api/types";
import { STALE_TIME } from "@/utils/constants";

interface RecurringLoanDetail extends RecurringLoan {
  template?: RecurringLoanTemplateVersion;
}

type RecurringLoanResponse = Omit<RecurringLoanDetail, "total_generated"> & {
  total_generated: number | string;
  template?: Omit<RecurringLoanTemplateVersion, "principal_amount" | "interest_rate_percent" | "max_generated_loan_principal_exposure"> & {
    principal_amount: number | string;
    interest_rate_percent: number | string | null;
    max_generated_loan_principal_exposure: number | string | null;
  };
};

function normalizeRecurringLoan(rl: RecurringLoanResponse): RecurringLoanDetail {
  return {
    ...rl,
    total_generated: Number(rl.total_generated),
    template: rl.template
      ? {
          ...rl.template,
          principal_amount: Number(rl.template.principal_amount),
          interest_rate_percent: rl.template.interest_rate_percent != null ? Number(rl.template.interest_rate_percent) : null,
          max_generated_loan_principal_exposure: rl.template.max_generated_loan_principal_exposure != null ? Number(rl.template.max_generated_loan_principal_exposure) : null,
        }
      : undefined,
  };
}

export function useRecurringLoans(page: number) {
  return useQuery({
    queryKey: ["recurring-loans", { page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      return apiGet<PaginatedResponse<RecurringLoanResponse>>(
        `/loans/recurring?${params.toString()}`,
      ).then((data) => ({
        ...data,
        items: data.items.map(normalizeRecurringLoan),
      }));
    },
    staleTime: STALE_TIME,
  });
}

export function useRecurringLoan(recurringId: string) {
  return useQuery({
    queryKey: ["recurring-loans", recurringId],
    queryFn: () =>
      apiGet<RecurringLoanResponse>(`/loans/recurring/${recurringId}`).then(
        normalizeRecurringLoan,
      ),
    staleTime: STALE_TIME,
    enabled: !!recurringId,
  });
}

export function useCreateRecurringLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<RecurringLoanResponse>("/loans/recurring", data).then(
        normalizeRecurringLoan,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
    },
  });
}

export function useUpdateRecurringLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) =>
      apiPatch<RecurringLoanResponse>(`/loans/recurring/${id}`, data).then(
        normalizeRecurringLoan,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
      queryClient.invalidateQueries({
        queryKey: ["recurring-loans", variables.id],
      });
    },
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<RecurringLoanResponse>(
        `/loans/recurring/${id}/submit-for-approval`,
      ).then(normalizeRecurringLoan),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-loans", id] });
    },
  });
}

export function useApproveRecurringLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<RecurringLoanResponse>(
        `/loans/recurring/${id}/approve`,
      ).then(normalizeRecurringLoan),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-loans", id] });
    },
  });
}

export function useRejectRecurringLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<RecurringLoanResponse>(
        `/loans/recurring/${id}/reject`,
        { reason },
      ).then(normalizeRecurringLoan),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-loans", id] });
    },
  });
}

export function usePauseRecurringLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<RecurringLoanResponse>(
        `/loans/recurring/${id}/pause`,
        { reason },
      ).then(normalizeRecurringLoan),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-loans", id] });
    },
  });
}

export function useResumeRecurringLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<RecurringLoanResponse>(
        `/loans/recurring/${id}/resume`,
      ).then(normalizeRecurringLoan),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-loans", id] });
    },
  });
}

export function useCancelRecurringLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<RecurringLoanResponse>(
        `/loans/recurring/${id}/cancel`,
        { reason },
      ).then(normalizeRecurringLoan),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-loans"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-loans", id] });
    },
  });
}

export function useGeneratedLoans(recurringId: string, page: number) {
  return useQuery({
    queryKey: ["recurring-loans", recurringId, "generated", { page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      return apiGet<PaginatedResponse<GeneratedLoanRecord>>(
        `/loans/recurring/${recurringId}/generated?${params.toString()}`,
      );
    },
    staleTime: STALE_TIME,
    enabled: !!recurringId,
  });
}
