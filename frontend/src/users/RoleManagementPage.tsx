import { useState } from "react";
import { Pencil, Shield } from "lucide-react";
import type { Role } from "@/api/types";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { useRoles } from "./hooks";
import { RolePermissionEditor } from "./RolePermissionEditor";

export function RoleManagementPage() {
  const { data: roles, isLoading, isError, refetch } = useRoles();
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <LoadingSkeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton className="h-40" count={3} />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState name="roles" message="Failed to load roles" onRetry={() => refetch()} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Role Management
        </h1>
        <p className="text-text-secondary font-body text-sm mt-1">
          Manage roles and their permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles?.map((role) => (
          <div
            key={role.id}
            data-testid="role-card"
            data-role-name={role.name.toLowerCase()}
            className="bg-surface rounded-card border border-border p-5"
          >
            {/* Also set the specific data-testid */}
            <div data-testid={`role-card-${role.name.toLowerCase()}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-primary" aria-hidden="true" />
                  <h3 className="font-heading text-base font-bold text-text-primary">
                    {role.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRole(role)}
                  className="p-2 rounded-button text-text-secondary hover:text-primary hover:bg-background transition-colors"
                  aria-label={`Edit ${role.name} permissions`}
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
              </div>
              <p className="font-body text-sm text-text-secondary mb-3">
                {role.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    data-testid="permission-chip"
                    className="inline-flex items-center rounded-badge bg-background px-2.5 py-1 text-xs font-medium text-text-secondary font-body"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <RolePermissionEditor
        open={editingRole !== null}
        onClose={() => setEditingRole(null)}
        role={editingRole}
      />
    </div>
  );
}

export default RoleManagementPage;
