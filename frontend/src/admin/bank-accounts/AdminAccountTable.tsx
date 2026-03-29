import { ChevronDown, ChevronUp, Eye, Plus } from "lucide-react";
import type { AdminAccountListItem } from "@/api/types";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { formatCurrency, formatDate } from "@/utils/format";

interface AdminAccountTableProps {
  items: AdminAccountListItem[];
  onView: (accountId: string) => void;
  onCreateAccount: (item: AdminAccountListItem) => void;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
}

function statusBadgeVariant(status: string): "active" | "paused" | "overdue" | "default" {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "FROZEN":
      return "paused";
    case "CLOSED":
      return "overdue";
    default:
      return "default";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "FROZEN":
      return "Frozen";
    case "CLOSED":
      return "Closed";
    case "NO_ACCOUNT":
      return "No Account";
    default:
      return status;
  }
}

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: string;
  sortColumn: string;
  sortDirection: "asc" | "desc";
}) {
  if (column !== sortColumn) return null;
  return sortDirection === "asc" ? (
    <ChevronUp size={14} aria-hidden="true" />
  ) : (
    <ChevronDown size={14} aria-hidden="true" />
  );
}

export function AdminAccountTable({
  items,
  onView,
  onCreateAccount,
  sortColumn,
  sortDirection,
  onSort,
}: AdminAccountTableProps) {
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
                User
                <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
            <th
              data-sortable
              className="text-left px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider cursor-pointer select-none"
              onClick={() => onSort("status")}
            >
              <span className="inline-flex items-center gap-1">
                Status
                <SortIcon column="status" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
            <th
              data-sortable
              className="text-right px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider cursor-pointer select-none"
              onClick={() => onSort("balance")}
            >
              <span className="inline-flex items-center gap-1 justify-end">
                Balance
                <SortIcon column="balance" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider">
              Last Transaction
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary font-body uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isNoAccount = item.status === "NO_ACCOUNT";
            return (
              <tr
                key={item.user_id}
                data-testid="account-row"
                className={`border-b border-border last:border-b-0 hover:bg-background/50 transition-colors ${
                  isNoAccount ? "bg-amber-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div data-testid="account-user-name" className="font-body text-sm font-medium text-text-primary">
                    {item.user_name}
                  </div>
                  <div className="font-body text-xs text-text-secondary mt-0.5">
                    {item.user_email}
                  </div>
                </td>
                <td className="px-4 py-3" data-testid="account-status">
                  <Badge
                    label={statusLabel(item.status)}
                    variant={statusBadgeVariant(item.status)}
                  />
                </td>
                <td className="px-4 py-3 text-right font-body text-sm text-text-primary">
                  {isNoAccount || item.current_balance === null
                    ? "\u2014"
                    : formatCurrency(item.current_balance)}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  {isNoAccount || !item.last_transaction_date
                    ? "\u2014"
                    : formatDate(item.last_transaction_date)}
                </td>
                <td className="px-4 py-3 text-right">
                  {isNoAccount ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={() => onCreateAccount(item)}
                    >
                      Create Account
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => onView(item.account_id!)}
                    >
                      View
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminAccountTable;
