import { useState, useEffect } from "react";
import type { Role } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { useUpdatePermissions } from "./hooks";

const ALL_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",
  "loans:read",
  "loans:write",
  "loans:delete",
  "payments:read",
  "payments:write",
  "payments:delete",
  "reports:read",
  "settings:read",
  "settings:write",
];

interface RolePermissionEditorProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}

export function RolePermissionEditor({ open, onClose, role }: RolePermissionEditorProps) {
  const toast = useToast();
  const updatePermissions = useUpdatePermissions();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && role) {
      setSelected([...role.permissions]);
    }
  }, [open, role]);

  function handleToggle(permission: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, permission] : prev.filter((p) => p !== permission),
    );
  }

  function handleSave() {
    if (!role) return;
    updatePermissions.mutate(
      { id: role.id, permissions: selected },
      {
        onSuccess: () => {
          toast.success("Permissions updated successfully");
          onClose();
        },
        onError: () => {
          toast.error("Failed to update permissions");
        },
      },
    );
  }

  if (!role) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${role.name} Permissions`}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={updatePermissions.isPending}
            isLoading={updatePermissions.isPending}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        {ALL_PERMISSIONS.map((permission) => (
          <label key={permission} className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(permission)}
              onChange={(e) => handleToggle(permission, e.target.checked)}
              className="rounded border-border-strong text-primary focus:ring-primary/30"
            />
            <span className="font-body text-sm text-text-primary">{permission}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

export default RolePermissionEditor;
