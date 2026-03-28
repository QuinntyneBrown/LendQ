import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/api/client";
import type { Loan, PaginatedResponse } from "@/api/types";
import type { LoanStatus } from "@/api/types";
import { STALE_TIME } from "@/utils/constants";

type LoanResponse = Omit<Loan, "principal" | "interest_rate" | "outstanding_balance"> & {
  principal: number | string;
  interest_rate: number | string;
  outstanding_balance: number | string;
};

function normalizeLoan(loan: LoanResponse): Loan {
  return {
    ...loan,
    principal: Number(loan.principal),
    interest_rate: Number(loan.interest_rate),
    outstanding_balance: Number(loan.outstanding_balance),
  };
}

export function useLoans(
  view: "creditor" | "borrower",
  page: number,
  search: string,
  status: LoanStatus | "",
) {
  return useQuery({
    queryKey: ["loans", { view, page, search, status }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("tab", view);
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return apiGet<PaginatedResponse<LoanResponse>>(`/loans?${params.toString()}`).then((data) => ({
        ...data,
        items: data.items.map(normalizeLoan),
      }));
    },
    staleTime: STALE_TIME,
  });
}

export function useLoanDetail(id: string) {
  return useQuery({
    queryKey: ["loans", id],
    queryFn: () => apiGet<LoanResponse>(`/loans/${id}`).then(normalizeLoan),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<LoanResponse>("/loans", data).then(normalizeLoan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      apiPatch<LoanResponse>(`/loans/${id}`, data).then(normalizeLoan),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loans", variables.id] });
    },
  });
}
