import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification, PaginatedResponse } from "@/api/types";
import { apiGet, apiPost } from "@/api/client";
export { useToast } from "./useToast";

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "count"],
    queryFn: () => apiGet<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useNotifications(page: number, type?: string) {
  return useQuery({
    queryKey: ["notifications", { page, type }],
    queryFn: () =>
      apiGet<PaginatedResponse<Notification>>("/notifications", {
        params: { page, ...(type ? { type } : {}) },
      }),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<void>(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<void>("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
