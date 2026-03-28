import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResponse, Role, User } from "@/api/types";
import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";

export function useUsers(page: number, search: string) {
  return useQuery({
    queryKey: ["users", { page, search }],
    queryFn: () =>
      apiGet<PaginatedResponse<User>>("/users", {
        params: { page, search },
      }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; roles: string[]; is_active: boolean }) =>
      apiPost<User>("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; email: string; roles: string[]; is_active: boolean }) =>
      apiPut<User>(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => apiGet<Role[]>("/roles"),
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      apiPut<Role>(`/roles/${id}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
