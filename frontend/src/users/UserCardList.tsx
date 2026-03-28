import { Pencil, Trash2 } from "lucide-react";
import type { User } from "@/api/types";
import { Badge } from "@/ui/Badge";

interface UserCardListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserCardList({ users, onEdit, onDelete }: UserCardListProps) {
  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div
          key={user.id}
          data-testid="user-card"
          className="bg-surface rounded-card border border-border p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-body text-sm font-medium text-text-primary">{user.name}</div>
              <div className="font-body text-xs text-text-secondary mt-0.5">{user.email}</div>
            </div>
            <Badge
              label={user.is_active ? "Active" : "Inactive"}
              variant={user.is_active ? "active" : "default"}
            />
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {user.roles.map((role) => (
              <Badge key={role.id} label={role.name} variant="default" />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              name="edit"
              onClick={() => onEdit(user)}
              className="p-2 rounded-button text-text-secondary hover:text-primary hover:bg-background transition-colors"
              aria-label={`Edit ${user.name}`}
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              name="delete"
              onClick={() => onDelete(user)}
              className="p-2 rounded-button text-danger-text hover:bg-danger/10 transition-colors"
              aria-label={`Delete ${user.name}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserCardList;
