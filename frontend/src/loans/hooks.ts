import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/api/client";
import type { Loan, PaginatedResponse } from "@/api/types";
import type { LoanStatus } from "@/api/types";
import { STALE_TIME } from "@/utils/constants";

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
      params.set("view", view);
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return apiGet<PaginatedResponse<Loan>>(`/loans?${params.toString()}`);
    },
    staleTime: STALE_TIME,
  });
}

export function useLoanDetail(id: string) {
  return useQuery({
    queryKey: ["loans", id],
    queryFn: () => apiGet<Loan>(`/loans/${id}`),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost<Loan>("/loans", data),
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
      apiPut<Loan>(`/loans/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loans", variables.id] });
    },
  });
}
