import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/api/client";
import type { DashboardSummary, LoanSummary, ActivityItem } from "@/api/types";
import { STALE_TIME } from "@/utils/constants";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => apiGet<DashboardSummary>("/dashboard/summary"),
    staleTime: STALE_TIME,
  });
}

export function useDashboardLoans(tab: "creditor" | "borrower") {
  return useQuery({
    queryKey: ["dashboard", "loans", tab],
    queryFn: () => apiGet<LoanSummary[]>(`/dashboard/loans?tab=${tab}`),
    staleTime: STALE_TIME,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => apiGet<ActivityItem[]>("/dashboard/activity?limit=20"),
    staleTime: STALE_TIME,
  });
}
