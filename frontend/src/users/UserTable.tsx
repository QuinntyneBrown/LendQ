import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { User } from "@/api/types";
import { Badge } from "@/ui/Badge";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
}

function SortIcon({ column, sortColumn, sortDirection }: { column: string; sortColumn: string; sortDirection: "asc" | "desc" }) {
  if (column !== sortColumn) return null;
  return sortDirection === "asc" ? (
    <ChevronUp size={14} aria-hidden="true" />
  ) : (
    <ChevronDown size={14} aria-hidden="true" />
  );
}

export function UserTable({ users, onEdit, onDelete, sortColumn, sortDirection, onSort }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th
              data-sortable
              className="text-left px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider cursor-pointer select-none"
              onClick={() => onSort("name")}
            >
              <span className="inline-flex items-center gap-1">
                Name
                <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
            <th
              data-sortable
              className="text-left px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider cursor-pointer select-none"
              onClick={() => onSort("email")}
            >
              <span className="inline-flex items-center gap-1">
                Email
                <SortIcon column="email" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider">
              Roles
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider">
              Status
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              data-testid="user-row"
              className="border-b border-border last:border-b-0 hover:bg-background/50 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="font-body text-sm font-medium text-text-primary">{user.name}</div>
                <div className="font-body text-xs text-text-secondary md:hidden">{user.email}</div>
              </td>
              <td className="px-4 py-3 font-body text-sm text-text-secondary hidden md:table-cell">
                {user.email}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role.id} label={role.name} variant="default" />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  label={user.is_active ? "Active" : "Inactive"}
                  variant={user.is_active ? "active" : "default"}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
