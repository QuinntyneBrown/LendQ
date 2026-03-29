import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/api/client";
import type { SavingsGoal, SavingsGoalEntry, PaginatedResponse } from "@/api/types";
import { STALE_TIME } from "@/utils/constants";

type SavingsGoalResponse = Omit<SavingsGoal, "target_amount" | "current_amount" | "progress_percent"> & {
  target_amount: number | string;
  current_amount: number | string;
  progress_percent: number | string;
};

function normalizeGoal(goal: SavingsGoalResponse): SavingsGoal {
  return {
    ...goal,
    target_amount: Number(goal.target_amount),
    current_amount: Number(goal.current_amount),
    progress_percent: Number(goal.progress_percent),
  };
}

type EntryResponse = Omit<SavingsGoalEntry, "amount" | "running_total"> & {
  amount: number | string;
  running_total: number | string;
};

function normalizeEntry(entry: EntryResponse): SavingsGoalEntry {
  return {
    ...entry,
    amount: Number(entry.amount),
    running_total: Number(entry.running_total),
  };
}

export function useSavingsGoals(page: number) {
  return useQuery({
    queryKey: ["savings-goals", { page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      return apiGet<PaginatedResponse<SavingsGoalResponse>>(`/savings-goals?${params.toString()}`).then((data) => ({
        ...data,
        items: data.items.map(normalizeGoal),
      }));
    },
    staleTime: STALE_TIME,
  });
}

export function useSavingsGoal(goalId: string) {
  return useQuery({
    queryKey: ["savings-goals", goalId],
    queryFn: () => apiGet<SavingsGoalResponse>(`/savings-goals/${goalId}`).then(normalizeGoal),
    staleTime: STALE_TIME,
    enabled: !!goalId,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<SavingsGoalResponse>("/savings-goals", data).then(normalizeGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      apiPatch<SavingsGoalResponse>(`/savings-goals/${id}`, data).then(normalizeGoal),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals", variables.id] });
    },
  });
}

export function useCancelSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expected_version }: { id: string; expected_version: number }) =>
      apiPost<SavingsGoalResponse>(`/savings-goals/${id}/cancel`, { expected_version }).then(normalizeGoal),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals", variables.id] });
    },
  });
}

export function useContribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      goalId,
      amount,
      account_id,
      idempotency_key,
    }: {
      goalId: string;
      amount: number;
      account_id: string;
      idempotency_key: string;
    }) =>
      apiPost<SavingsGoalEntry>(`/savings-goals/${goalId}/contribute`, {
        amount,
        account_id,
      }, {
        headers: { "Idempotency-Key": idempotency_key },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goal-entries"] });
    },
  });
}

export function useReleaseFunds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      goalId,
      amount,
      account_id,
      idempotency_key,
    }: {
      goalId: string;
      amount: number;
      account_id: string;
      idempotency_key: string;
    }) =>
      apiPost<SavingsGoalEntry>(`/savings-goals/${goalId}/release`, {
        amount,
        account_id,
      }, {
        headers: { "Idempotency-Key": idempotency_key },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goal-entries"] });
    },
  });
}

export function useSavingsGoalEntries(goalId: string, page: number) {
  return useQuery({
    queryKey: ["savings-goal-entries", goalId, { page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      return apiGet<PaginatedResponse<EntryResponse>>(`/savings-goals/${goalId}/entries?${params.toString()}`).then((data) => ({
        ...data,
        items: data.items.map(normalizeEntry),
      }));
    },
    staleTime: STALE_TIME,
    enabled: !!goalId,
  });
}
