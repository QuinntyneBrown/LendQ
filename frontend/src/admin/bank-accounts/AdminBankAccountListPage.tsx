import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Users } from "lucide-react";
import type { AdminAccountListItem } from "@/api/types";
import { SearchInput } from "@/ui/SearchInput";
import { Select } from "@/ui/Select";
import { Pagination } from "@/ui/Pagination";
import { EmptyState } from "@/ui/EmptyState";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { Card } from "@/ui/Card";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { useAdminAccounts, useDeleteOrphanAccount } from "@/admin/bank-accounts/hooks";
import { useToast } from "@/notifications/useToast";
import { formatCurrency } from "@/utils/format";
import { AdminAccountTable } from "./AdminAccountTable";
import { AdminAccountCardList } from "./AdminAccountCardList";
import { CreateBankAccountDialog } from "./CreateBankAccountDialog";

const statusFilterOptions = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "FROZEN", label: "Frozen" },
  { value: "CLOSED", label: "Closed" },
  { value: "NO_ACCOUNT", label: "No Account" },
  { value: "ORPHAN", label: "Orphan" },
];

export function AdminBankAccountListPage() {
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [createUser, setCreateUser] = useState<{ user_id: string; user_name: string; user_email: string } | null>(null);
  const [orphanToDelete, setOrphanToDelete] = useState<AdminAccountListItem | null>(null);

  const { data, isLoading, isError, refetch } = useAdminAccounts(page, search, statusFilter);
  const deleteOrphan = useDeleteOrphanAccount();
  const toast = useToast();

  function handleSort(column: string) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function handleView(accountId: string) {
    navigate(`/admin/accounts/${accountId}`);
  }

  function handleCreateAccount(item: AdminAccountListItem) {
    setCreateUser({
      user_id: item.user_id,
      user_name: item.user_name,
      user_email: item.user_email,
    });
    setCreateOpen(true);
  }

  function handleCreateClose() {
    setCreateOpen(false);
    setCreateUser(null);
  }

  function handleDeleteOrphan(item: AdminAccountListItem) {
    setOrphanToDelete(item);
  }

  function handleConfirmDeleteOrphan() {
    if (!orphanToDelete?.account_id) return;
    deleteOrphan.mutate(orphanToDelete.account_id, {
      onSuccess: () => {
        toast.success("Orphan account deleted");
        setOrphanToDelete(null);
      },
      onError: () => {
        toast.error("Failed to delete orphan account");
      },
    });
  }

  const stats = data?.stats;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-text-primary">
            Bank Accounts
          </h1>
          <p className="text-text-secondary font-body text-[15px] mt-1">
            Manage all user bank accounts
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <div data-testid="stat-total-accounts" className="px-4 py-4">
              <p className="text-sm font-medium text-text-secondary font-body">Total Accounts</p>
              <p className="text-2xl font-bold text-text-primary font-heading mt-1">
                {stats.total_accounts}
              </p>
            </div>
          </Card>
          <Card>
            <div data-testid="stat-active-accounts" className="px-4 py-4">
              <p className="text-sm font-medium text-text-secondary font-body">Active</p>
              <p className="text-2xl font-bold text-success-text font-heading mt-1">
                {stats.active_accounts}
              </p>
            </div>
          </Card>
          <Card>
            <div data-testid="stat-frozen-accounts" className="px-4 py-4">
              <p className="text-sm font-medium text-text-secondary font-body">Frozen</p>
              <p className="text-2xl font-bold text-warning-text font-heading mt-1">
                {stats.frozen_accounts}
              </p>
            </div>
          </Card>
          <Card>
            <div data-testid="stat-no-account" className="px-4 py-4">
              <p className="text-sm font-medium text-text-secondary font-body">No Account</p>
              <p className="text-2xl font-bold text-text-secondary font-heading mt-1">
                {stats.no_account_users}
              </p>
            </div>
          </Card>
          <Card>
            <div data-testid="stat-orphan-accounts" className="px-4 py-4">
              <p className="text-sm font-medium text-text-secondary font-body">Orphan</p>
              <p className="text-2xl font-bold text-danger-text font-heading mt-1">
                {stats.orphan_accounts}
              </p>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label=""
            name="status-filter"
            data-testid="status-filter"
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div data-testid="loading-state" className="flex flex-col gap-3">
          <LoadingSkeleton className="h-12" count={5} />
        </div>
      ) : isError ? (
        <ErrorState name="accounts" message="Failed to load bank accounts" onRetry={() => refetch()} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="bg-surface rounded-card border border-border">
            {isMobile ? (
              <div className="p-3">
                <AdminAccountCardList
                  items={data.items}
                  onView={handleView}
                  onCreateAccount={handleCreateAccount}
                  onDeleteOrphan={handleDeleteOrphan}
                />
              </div>
            ) : (
              <AdminAccountTable
                items={data.items}
                onView={handleView}
                onCreateAccount={handleCreateAccount}
                onDeleteOrphan={handleDeleteOrphan}
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
          title="No accounts found"
          description={search || statusFilter ? "Try adjusting your search or filter" : "No bank accounts have been created yet"}
        />
      )}

      <CreateBankAccountDialog
        open={createOpen}
        onClose={handleCreateClose}
        user={createUser}
      />

      <Modal
        open={!!orphanToDelete}
        onClose={() => setOrphanToDelete(null)}
        title="Delete Orphan Account?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOrphanToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              icon={Trash2}
              onClick={handleConfirmDeleteOrphan}
              disabled={deleteOrphan.isPending}
              isLoading={deleteOrphan.isPending}
              data-testid="confirm-delete-orphan-button"
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div
            className="flex items-center justify-center rounded-full mb-4"
            style={{ width: 56, height: 56, backgroundColor: "#FEE2E2" }}
          >
            <Trash2 size={24} className="text-danger-text" aria-hidden="true" />
          </div>
          <p className="font-body text-sm text-text-secondary max-w-sm">
            This will permanently delete the orphan bank account and all related
            transactions. This cannot be undone.
          </p>
          {orphanToDelete && (
            <div className="mt-4 bg-background rounded-card px-4 py-3 text-left w-full max-w-sm">
              <div className="font-body text-xs text-text-secondary">Account ID</div>
              <div className="font-body text-sm font-medium text-text-primary mt-0.5">
                {orphanToDelete.account_id}
              </div>
              <div className="font-body text-xs text-text-secondary mt-2">Balance</div>
              <div className="font-body text-sm font-medium text-text-primary mt-0.5">
                {orphanToDelete.current_balance !== null
                  ? formatCurrency(orphanToDelete.current_balance)
                  : "\u2014"}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default AdminBankAccountListPage;
