import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/api/client";
import type { BankAccount, BankTransaction, RecurringDeposit, PaginatedResponse } from "@/api/types";
import { STALE_TIME } from "@/utils/constants";

function generateKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAccount(a: any): BankAccount {
  return { ...a, current_balance: Number(a.current_balance) };
}

function normalizeTxn(t: any): BankTransaction {
  return { ...t, amount: Number(t.amount), balance_before: Number(t.balance_before), balance_after: Number(t.balance_after) };
}

function normalizeDeposit(d: any): RecurringDeposit {
  return { ...d, amount: Number(d.amount) };
}

export function useMyAccount() {
  return useQuery({
    queryKey: ["accounts", "mine"],
    queryFn: () => apiGet<PaginatedResponse<any>>("/accounts").then(data => ({
      ...data,
      items: data.items.map(normalizeAccount),
    })),
    staleTime: STALE_TIME,
  });
}

export function useAccount(accountId: string) {
  return useQuery({
    queryKey: ["accounts", accountId],
    queryFn: () => apiGet<any>(`/accounts/${accountId}`).then(normalizeAccount),
    staleTime: STALE_TIME,
    enabled: !!accountId,
  });
}

export function useTransactions(accountId: string, page: number = 1, entryType?: string) {
  return useQuery({
    queryKey: ["accounts", accountId, "transactions", { page, entryType }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (entryType) params.set("entry_type", entryType);
      return apiGet<PaginatedResponse<any>>(`/accounts/${accountId}/transactions?${params}`).then(data => ({
        ...data,
        items: data.items.map(normalizeTxn),
      }));
    },
    staleTime: STALE_TIME,
    enabled: !!accountId,
  });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, ...data }: { accountId: string; amount: string; reason_code: string; description?: string }) =>
      apiPost(`/accounts/${accountId}/deposit`, data, {
        headers: { "Idempotency-Key": `deposit-${generateKey()}` },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, ...data }: { accountId: string; amount: string; reason_code: string; description?: string }) =>
      apiPost(`/accounts/${accountId}/withdraw`, data, {
        headers: { "Idempotency-Key": `withdraw-${generateKey()}` },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useRecurringDeposits(accountId: string) {
  return useQuery({
    queryKey: ["accounts", accountId, "recurring-deposits"],
    queryFn: () => apiGet<PaginatedResponse<any>>(`/accounts/${accountId}/recurring-deposits`).then(data => ({
      ...data,
      items: data.items.map(normalizeDeposit),
    })),
    staleTime: STALE_TIME,
    enabled: !!accountId,
  });
}

export function useCreateRecurringDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, ...data }: { accountId: string } & Record<string, unknown>) =>
      apiPost(`/accounts/${accountId}/recurring-deposits`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function usePauseRecurringDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, depositId }: { accountId: string; depositId: string }) =>
      apiPost(`/accounts/${accountId}/recurring-deposits/${depositId}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useResumeRecurringDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, depositId }: { accountId: string; depositId: string }) =>
      apiPost(`/accounts/${accountId}/recurring-deposits/${depositId}/resume`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useCancelRecurringDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, depositId }: { accountId: string; depositId: string }) =>
      apiDelete(`/accounts/${accountId}/recurring-deposits/${depositId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
