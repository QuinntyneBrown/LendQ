import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Select } from "@/ui/Select";
import { Pagination } from "@/ui/Pagination";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { EmptyState } from "@/ui/EmptyState";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { formatCurrency, formatDate } from "@/utils/format";
import type { BankTransaction, RecurringDeposit } from "@/api/types";
import {
  useAdminAccountDetail,
  useAdminAccountTransactions,
  useAdminAccountRecurringDeposits,
} from "@/admin/bank-accounts/hooks";
import { DepositWithdrawDialog } from "@/bank-account/DepositWithdrawDialog";
import { AccountStatusDialog } from "./AccountStatusDialog";

const entryTypeFilterOptions = [
  { value: "", label: "All Types" },
  { value: "MANUAL_DEPOSIT", label: "Manual Deposit" },
  { value: "MANUAL_WITHDRAWAL", label: "Manual Withdrawal" },
  { value: "RECURRING_DEPOSIT", label: "Recurring Deposit" },
  { value: "REVERSAL", label: "Reversal" },
  { value: "SAVINGS_CONTRIBUTION", label: "Savings Contribution" },
  { value: "SAVINGS_RELEASE", label: "Savings Release" },
];

function accountStatusBadgeVariant(
  status: string,
): "active" | "paused" | "overdue" | "default" {
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

function entryTypeLabel(entryType: string): string {
  switch (entryType) {
    case "MANUAL_DEPOSIT":
      return "Deposit";
    case "MANUAL_WITHDRAWAL":
      return "Withdrawal";
    case "RECURRING_DEPOSIT":
      return "Recurring";
    case "REVERSAL":
      return "Reversal";
    case "SAVINGS_CONTRIBUTION":
      return "Savings";
    case "SAVINGS_RELEASE":
      return "Release";
    default:
      return entryType.replace(/_/g, " ");
  }
}

function entryTypeBadgeVariant(
  entryType: string,
): "active" | "default" | "overdue" | "paused" | "paid_off" {
  switch (entryType) {
    case "MANUAL_DEPOSIT":
      return "active";
    case "RECURRING_DEPOSIT":
      return "active";
    case "MANUAL_WITHDRAWAL":
      return "default";
    case "REVERSAL":
      return "overdue";
    case "SAVINGS_CONTRIBUTION":
      return "paid_off";
    case "SAVINGS_RELEASE":
      return "paused";
    default:
      return "default";
  }
}

function recurringStatusBadgeVariant(
  status: string,
): "active" | "paused" | "overdue" | "paid_off" | "default" {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "PAUSED":
      return "paused";
    case "FAILED":
      return "overdue";
    case "COMPLETED":
      return "paid_off";
    case "CANCELLED":
      return "default";
    default:
      return "default";
  }
}

function getTransactionDescription(txn: BankTransaction): string {
  if (txn.description && txn.description.trim()) {
    return txn.description;
  }
  const descriptions: Record<string, string> = {
    MANUAL_DEPOSIT: "Manual Deposit",
    MANUAL_WITHDRAWAL: "Manual Withdrawal",
    RECURRING_DEPOSIT: "Recurring Deposit",
    REVERSAL: "Transaction Reversal",
    SAVINGS_CONTRIBUTION: "Savings Contribution",
    SAVINGS_RELEASE: "Savings Release",
  };
  return descriptions[txn.entry_type] ?? txn.entry_type.replace(/_/g, " ");
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

export function AdminBankAccountDetailPage() {
  const { accountId } = useParams();
  const { isMobile } = useBreakpoint();

  const [txPage, setTxPage] = useState(1);
  const [txFilter, setTxFilter] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useAdminAccountDetail(accountId!);
  const { data: txnData, isLoading: txnLoading } = useAdminAccountTransactions(
    accountId!,
    txPage,
    txFilter,
  );
  const { data: recurringData, isLoading: recurringLoading } =
    useAdminAccountRecurringDeposits(accountId!);

  if (isLoading) {
    return (
      <div className="p-6" data-testid="loading-state">
        <div className="flex flex-col gap-6">
          <LoadingSkeleton count={3} className="h-12" />
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="p-6">
        <ErrorState
          name="account-detail"
          message="Failed to load account details"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { account, user, stats } = detail;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link
          to="/admin/accounts"
          role="link"
          className="inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Bank Accounts
        </Link>
      </div>

      {/* User header card */}
      <Card>
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
              <span className="font-body text-base font-semibold">
                {getInitials(user.name)}
              </span>
            </div>
            <div>
              <p
                data-testid="detail-user-name"
                className="font-heading text-xl font-bold text-text-primary"
              >
                {user.name}
              </p>
              <p
                data-testid="detail-user-email"
                className="font-body text-sm text-text-secondary mt-0.5"
              >
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <div data-testid="detail-account-status">
              <Badge
                label={account.status}
                variant={accountStatusBadgeVariant(account.status)}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              Manage Status
            </Button>
          </div>
        </div>
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div data-testid="metric-current-balance" className="px-4 py-4">
            <p className="text-sm font-medium text-text-secondary font-body">
              Current Balance
            </p>
            <p className="text-2xl font-bold text-text-primary font-heading mt-1">
              {formatCurrency(account.current_balance)}
            </p>
          </div>
        </Card>
        <Card>
          <div data-testid="metric-total-deposits" className="px-4 py-4">
            <p className="text-sm font-medium text-text-secondary font-body">
              Total Deposits
            </p>
            <p className="text-2xl font-bold text-success-text font-heading mt-1">
              {formatCurrency(stats.total_deposits)}
            </p>
          </div>
        </Card>
        <Card>
          <div data-testid="metric-total-withdrawals" className="px-4 py-4">
            <p className="text-sm font-medium text-text-secondary font-body">
              Total Withdrawals
            </p>
            <p className="text-2xl font-bold text-danger-text font-heading mt-1">
              {formatCurrency(stats.total_withdrawals)}
            </p>
          </div>
        </Card>
        <Card>
          <div data-testid="metric-account-created" className="px-4 py-4">
            <p className="text-sm font-medium text-text-secondary font-body">
              Account Created
            </p>
            <p className="text-2xl font-bold text-text-primary font-heading mt-1">
              {formatDate(account.created_at)}
            </p>
          </div>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          icon={ArrowDownCircle}
          onClick={() => setDepositOpen(true)}
          className="bg-success text-success-text hover:bg-success/80"
        >
          Deposit
        </Button>
        <Button
          variant="destructive"
          icon={ArrowUpCircle}
          onClick={() => setWithdrawOpen(true)}
        >
          Withdraw
        </Button>
      </div>

      {/* Transaction History */}
      <Card>
        <div
          data-testid="transaction-history-section"
          className="flex flex-col"
        >
          <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Transaction History
            </h2>
            <div className="sm:ml-auto w-full sm:w-48">
              <Select
                label=""
                name="transaction-type-filter"
                data-testid="transaction-type-filter"
                options={entryTypeFilterOptions}
                value={txFilter}
                onChange={(e) => {
                  setTxFilter(e.target.value);
                  setTxPage(1);
                }}
              />
            </div>
          </div>

          {txnLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={5} className="h-12" />
            </div>
          ) : !txnData?.items?.length ? (
            <div className="p-6" data-testid="empty-transactions">
              <EmptyState
                icon={Wallet}
                title="No transactions found"
                description={
                  txFilter
                    ? "Try adjusting your filter."
                    : "Transactions will appear here once funds are moved."
                }
              />
            </div>
          ) : isMobile ? (
            <TransactionCardList transactions={txnData.items} />
          ) : (
            <TransactionTable transactions={txnData.items} />
          )}

          {txnData && txnData.pages > 1 && (
            <div className="flex justify-center px-6 py-4 border-t border-border">
              <Pagination
                page={txnData.page}
                totalPages={txnData.pages}
                onPageChange={setTxPage}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Recurring Deposits */}
      <Card>
        <div
          data-testid="recurring-deposits-section"
          className="flex flex-col"
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Recurring Deposits
            </h2>
          </div>

          {recurringLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={3} className="h-12" />
            </div>
          ) : !recurringData?.items?.length ? (
            <div className="p-6" data-testid="empty-recurring">
              <EmptyState
                icon={RefreshCw}
                title="No recurring deposits"
                description="No recurring deposit schedules have been set up for this account."
              />
            </div>
          ) : isMobile ? (
            <RecurringCardList deposits={recurringData.items} />
          ) : (
            <RecurringTable deposits={recurringData.items} />
          )}
        </div>
      </Card>

      {/* Dialogs */}
      <DepositWithdrawDialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        mode="deposit"
        accountId={accountId!}
        currentBalance={account.current_balance}
      />
      <DepositWithdrawDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        mode="withdraw"
        accountId={accountId!}
        currentBalance={account.current_balance}
      />
      <AccountStatusDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        account={{
          id: accountId!,
          status: account.status,
          user_name: user.name,
          user_email: user.email,
          current_balance: account.current_balance,
        }}
      />
    </div>
  );
}

/* ---- Sub-components ---- */

function TransactionTable({
  transactions,
}: {
  transactions: BankTransaction[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Date
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Description
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Type
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Amount
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Balance After
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((txn) => (
            <tr
              key={txn.id}
              data-testid="transaction-row"
              className="hover:bg-background transition-colors"
            >
              <td className="px-6 py-3 text-sm text-text-primary font-body whitespace-nowrap">
                {formatDate(txn.created_at)}
              </td>
              <td className="px-6 py-3 text-sm text-text-secondary font-body max-w-[200px] truncate">
                {getTransactionDescription(txn)}
              </td>
              <td className="px-6 py-3">
                <Badge
                  label={entryTypeLabel(txn.entry_type)}
                  variant={entryTypeBadgeVariant(txn.entry_type)}
                />
              </td>
              <td className="px-6 py-3 text-sm font-semibold text-right font-body whitespace-nowrap">
                <span
                  className={
                    txn.direction === "CREDIT"
                      ? "text-success-text"
                      : "text-danger-text"
                  }
                >
                  {txn.direction === "CREDIT" ? "+" : "-"}
                  {formatCurrency(txn.amount)}
                </span>
              </td>
              <td className="px-6 py-3 text-sm text-text-primary text-right font-body whitespace-nowrap">
                {formatCurrency(txn.balance_after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionCardList({
  transactions,
}: {
  transactions: BankTransaction[];
}) {
  return (
    <div className="divide-y divide-border">
      {transactions.map((txn) => (
        <div
          key={txn.id}
          data-testid="transaction-card"
          className="px-4 py-3 flex items-center gap-3"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              txn.direction === "CREDIT" ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"
            }`}
          >
            {txn.direction === "CREDIT" ? (
              <ArrowDownCircle size={16} className="text-success-text" />
            ) : (
              <ArrowUpCircle size={16} className="text-danger-text" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary font-body truncate">
              {getTransactionDescription(txn)}
            </p>
            <p className="text-xs text-text-muted font-body">
              {entryTypeLabel(txn.entry_type)} &middot;{" "}
              {formatDate(txn.created_at)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p
              className={`text-sm font-semibold font-body ${
                txn.direction === "CREDIT"
                  ? "text-success-text"
                  : "text-danger-text"
              }`}
            >
              {txn.direction === "CREDIT" ? "+" : "-"}
              {formatCurrency(txn.amount)}
            </p>
            <p className="text-xs text-text-muted font-body">
              {formatCurrency(txn.balance_after)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecurringTable({ deposits }: { deposits: RecurringDeposit[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Source
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Amount
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Frequency
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Next Run
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {deposits.map((dep) => (
            <tr
              key={dep.id}
              data-testid="recurring-deposit-card"
              className="hover:bg-background transition-colors"
            >
              <td className="px-6 py-3 text-sm text-text-primary font-body">
                {dep.source_description}
              </td>
              <td className="px-6 py-3 text-sm font-semibold text-text-primary font-body">
                {formatCurrency(dep.amount)}
              </td>
              <td className="px-6 py-3 text-sm text-text-secondary font-body">
                {dep.frequency}
              </td>
              <td className="px-6 py-3 text-sm text-text-secondary font-body whitespace-nowrap">
                {dep.next_execution_at
                  ? formatDate(dep.next_execution_at)
                  : "--"}
              </td>
              <td className="px-6 py-3">
                <Badge
                  label={dep.status}
                  variant={recurringStatusBadgeVariant(dep.status)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecurringCardList({ deposits }: { deposits: RecurringDeposit[] }) {
  return (
    <div className="divide-y divide-border">
      {deposits.map((dep) => (
        <div
          key={dep.id}
          data-testid="recurring-deposit-card"
          className="px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary font-body truncate">
                {dep.source_description}
              </p>
              <p className="text-xs text-text-muted font-body mt-0.5">
                {formatCurrency(dep.amount)} &middot; {dep.frequency}
              </p>
              {dep.next_execution_at && (
                <p className="text-xs text-text-muted font-body mt-0.5">
                  Next: {formatDate(dep.next_execution_at)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                label={dep.status}
                variant={recurringStatusBadgeVariant(dep.status)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminBankAccountDetailPage;
