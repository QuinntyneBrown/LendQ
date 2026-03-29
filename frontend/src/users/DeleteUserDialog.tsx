import { Trash2 } from "lucide-react";
import type { User } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { useDeleteUser } from "./hooks";

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export function DeleteUserDialog({ open, onClose, user, onSuccess }: DeleteUserDialogProps) {
  const toast = useToast();
  const deleteUser = useDeleteUser();

  function handleDelete() {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete User?"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            icon={Trash2}
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            isLoading={deleteUser.isPending}
          >
            Delete
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div
          data-testid="warning-icon"
          className="flex items-center justify-center rounded-full mb-4"
          style={{ width: 56, height: 56, backgroundColor: "#FEE2E2" }}
        >
          <Trash2 size={24} className="text-danger-text" aria-hidden="true" />
        </div>
        <h3 className="font-heading text-[20px] font-bold text-text-primary mb-2">
          Delete User?
        </h3>
        <p
          data-testid="confirmation-message"
          className="font-body text-sm text-text-secondary max-w-sm"
        >
          Are you sure you want to delete {user.name}? This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
}

export default DeleteUserDialog;
