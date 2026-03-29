import { Trash2 } from "lucide-react";
import type { User } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { useDeleteUser, usePurgeUser } from "./hooks";
import { isTestUser } from "./utils";

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export function DeleteUserDialog({ open, onClose, user, onSuccess }: DeleteUserDialogProps) {
  const toast = useToast();
  const deleteUser = useDeleteUser();
  const purgeUser = usePurgeUser();
  const testUser = isTestUser(user.email);

  function handleDeactivate() {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success("User deleted successfully");
        onClose();
        onSuccess();
      },
      onError: () => {
        toast.error("Failed to delete user");
      },
    });
  }

  function handlePurge() {
    purgeUser.mutate(user.id, {
      onSuccess: () => {
        toast.success("User permanently deleted");
        onClose();
        onSuccess();
      },
      onError: () => {
        toast.error("Failed to permanently delete user");
      },
    });
  }

  const footer = testUser ? (
    <div className="flex justify-end gap-3">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="secondary"
        onClick={handleDeactivate}
        data-testid="deactivate-button"
      >
        Deactivate
      </Button>
      <Button
        variant="destructive"
        icon={Trash2}
        onClick={handlePurge}
        data-testid="purge-button"
        disabled={purgeUser.isPending}
        isLoading={purgeUser.isPending}
      >
        Permanently Delete
      </Button>
    </div>
  ) : (
    <div className="flex justify-end gap-3">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        icon={Trash2}
        onClick={handleDeactivate}
        disabled={deleteUser.isPending}
        isLoading={deleteUser.isPending}
      >
        Delete
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={testUser ? "Permanently Delete User?" : "Delete User?"}
      footer={footer}
    >
      <div className="flex flex-col items-center text-center py-4">
        <div
          data-testid="warning-icon"
          className="flex items-center justify-center rounded-full mb-4"
          style={{
            width: 56,
            height: 56,
            backgroundColor: testUser ? "#DC2626" : "#FEE2E2",
          }}
        >
          <Trash2
            size={24}
            className={testUser ? "text-white" : "text-danger-text"}
            aria-hidden="true"
          />
        </div>
        {testUser ? (
          <>
            <h3 className="font-heading text-[20px] font-bold text-text-primary mb-2">
              Permanently Delete User?
            </h3>
            <p
              data-testid="confirmation-message"
              className="font-body text-sm text-text-secondary max-w-sm"
            >
              This will permanently delete <strong>{user.name}</strong> and ALL their data including
              bank accounts, loans, transactions, and notifications. This cannot be undone.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-heading text-[20px] font-bold text-text-primary mb-2">
              Delete User?
            </h3>
            <p
              data-testid="confirmation-message"
              className="font-body text-sm text-text-secondary max-w-sm"
            >
              Are you sure you want to delete {user.name}? This action cannot be undone.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

export default DeleteUserDialog;
