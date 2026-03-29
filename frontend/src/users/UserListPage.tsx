import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import type { User } from "@/api/types";
import { Button } from "@/ui/Button";
import { SearchInput } from "@/ui/SearchInput";
import { Pagination } from "@/ui/Pagination";
import { EmptyState } from "@/ui/EmptyState";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { useUsers } from "./hooks";
import { UserTable } from "./UserTable";
import { UserCardList } from "./UserCardList";
import { AddEditUserDialog } from "./AddEditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";

export function UserListPage() {
  const { isMobile } = useBreakpoint();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data, isLoading, isError, refetch } = useUsers(page, search);

  function handleSort(column: string) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setAddEditOpen(true);
  }

  function handleDelete(user: User) {
    setDeletingUser(user);
    setDeleteOpen(true);
  }

  function handleAddNew() {
    setEditingUser(undefined);
    setAddEditOpen(true);
  }

  function handleDialogClose() {
    setAddEditOpen(false);
    setEditingUser(undefined);
  }

  function handleDeleteClose() {
    setDeleteOpen(false);
    setDeletingUser(null);
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-text-primary">
            User Management
          </h1>
          <p className="text-text-secondary font-body text-[15px] mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={handleAddNew}>
          Add User
        </Button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search users..."
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-12" count={5} />
        </div>
      ) : isError ? (
        <ErrorState name="users" message="Failed to load users" onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="bg-surface rounded-card border border-border">
            {isMobile ? (
              <div className="p-3">
                <UserCardList users={data.items} onEdit={handleEdit} onDelete={handleDelete} />
              </div>
            ) : (
              <UserTable
                users={data.items}
                onEdit={handleEdit}
                onDelete={handleDelete}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <Pagination page={page} totalPages={data.pages} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="No users found"
          description={search ? "Try adjusting your search terms" : "Get started by adding your first user"}
          action={
            !search ? (
              <Button variant="primary" icon={UserPlus} onClick={handleAddNew}>
                Add User
              </Button>
            ) : undefined
          }
        />
      )}

      <AddEditUserDialog
        open={addEditOpen}
        onClose={handleDialogClose}
        user={editingUser}
        onSuccess={() => refetch()}
      />

      {deletingUser && (
        <DeleteUserDialog
          open={deleteOpen}
          onClose={handleDeleteClose}
          user={deletingUser}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

export default UserListPage;
