import { Eye, Plus } from "lucide-react";
import type { AdminAccountListItem } from "@/api/types";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { formatCurrency } from "@/utils/format";

interface AdminAccountCardListProps {
  items: AdminAccountListItem[];
  onView: (accountId: string) => void;
  onCreateAccount: (item: AdminAccountListItem) => void;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminAccountCardList({
  items,
  onView,
  onCreateAccount,
}: AdminAccountCardListProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isNoAccount = item.status === "NO_ACCOUNT";
        return (
          <div
            key={item.user_id}
            data-testid="account-card"
            className={`bg-surface rounded-card border border-border p-4 ${
              isNoAccount ? "bg-amber-50" : ""
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                <span className="font-body text-sm font-semibold">
                  {getInitials(item.user_name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div data-testid="account-user-name" className="font-body text-sm font-medium text-text-primary">
                  {item.user_name}
                </div>
                <div className="font-body text-xs text-text-secondary mt-0.5">
                  {item.user_email}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div data-testid="account-status">
                <Badge
                  label={statusLabel(item.status)}
                  variant={statusBadgeVariant(item.status)}
                />
              </div>
              <div className="font-body text-sm font-semibold text-text-primary">
                {isNoAccount || item.current_balance === null
                  ? "\u2014"
                  : formatCurrency(item.current_balance)}
              </div>
            </div>
            <div className="flex items-center justify-end pt-2 border-t border-border">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdminAccountCardList;
