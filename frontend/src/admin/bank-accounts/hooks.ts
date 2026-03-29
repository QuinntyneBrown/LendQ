import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/api/client";
import type {
  AdminAccountListResponse,
  AdminAccountDetail,
  CreateAdminAccountData,
  ChangeStatusData,
  BankAccount,
  PaginatedResponse,
  BankTransaction,
  RecurringDeposit,
} from "@/api/types";

export function useAdminAccounts(page: number, search: string, status: string) {
  return useQuery({
    queryKey: ["admin", "accounts", { page, search, status }],
    queryFn: () =>
      apiGet<AdminAccountListResponse>("/admin/accounts", {
        params: { page, search, status },
      }),
  });
}

export function useAdminAccountDetail(accountId: string) {
  return useQuery({
    queryKey: ["admin", "accounts", accountId],
    queryFn: () =>
      apiGet<AdminAccountDetail>(`/admin/accounts/${accountId}`),
    enabled: !!accountId,
  });
}

export function useAdminAccountTransactions(
  accountId: string,
  page: number,
  entryType: string,
) {
  return useQuery({
    queryKey: ["admin", "accounts", accountId, "transactions", { page, entryType }],
    queryFn: () =>
      apiGet<PaginatedResponse<BankTransaction>>(
        `/accounts/${accountId}/transactions`,
        { params: { page, entry_type: entryType || undefined } },
      ),
    enabled: !!accountId,
  });
}

export function useAdminAccountRecurringDeposits(accountId: string) {
  return useQuery({
    queryKey: ["admin", "accounts", accountId, "recurring-deposits"],
    queryFn: () =>
      apiGet<PaginatedResponse<RecurringDeposit>>(
        `/accounts/${accountId}/recurring-deposits`,
      ),
    enabled: !!accountId,
  });
}

export function useCreateAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdminAccountData) =>
      apiPost<BankAccount>("/admin/accounts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
  });
}

export function useChangeAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      ...data
    }: ChangeStatusData & { accountId: string }) =>
      apiPatch<BankAccount>(`/admin/accounts/${accountId}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
  });
}

// Re-export deposit/withdraw from existing hooks since they work on any account for admins
export { useDeposit, useWithdraw } from "@/bank-account/hooks";
