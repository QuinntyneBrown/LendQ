import { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Wallet,
  Pause,
  Play,
  X,
} from "lucide-react";
import { useAuth } from "@/auth/hooks";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Select } from "@/ui/Select";
import { Pagination } from "@/ui/Pagination";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { EmptyState } from "@/ui/EmptyState";
import { formatCurrency, formatDate, relativeTime } from "@/utils/format";
import { useToast } from "@/notifications/useToast";
import type { BankTransaction, RecurringDeposit } from "@/api/types";
import {
  useMyAccount,
  useTransactions,
  useRecurringDeposits,
  usePauseRecurringDeposit,
  useResumeRecurringDeposit,
  useCancelRecurringDeposit,
} from "./hooks";
import { DepositWithdrawDialog } from "./DepositWithdrawDialog";
import { RecurringDepositDialog } from "./RecurringDepositDialog";

const entryTypeFilterOptions = [
  { value: "", label: "All Types" },
  { value: "MANUAL_DEPOSIT", label: "Manual Deposit" },
  { value: "MANUAL_WITHDRAWAL", label: "Manual Withdrawal" },
  { value: "RECURRING_DEPOSIT", label: "Recurring Deposit" },
  { value: "REVERSAL", label: "Reversal" },
  { value: "SAVINGS_CONTRIBUTION", label: "Savings Contribution" },
  { value: "SAVINGS_RELEASE", label: "Savings Release" },
];

function statusBadgeVariant(status: string): "active" | "paused" | "overdue" | "paid_off" | "default" {
  switch (status) {
    case "ACTIVE": return "active";
    case "PAUSED": return "paused";
    case "FAILED": return "overdue";
    case "COMPLETED": return "paid_off";
    case "CANCELLED": return "default";
    default: return "default";
  }
}

export function BankAccountPage() {
  const { roles } = useAuth();
  const { isMobile } = useBreakpoint();
  const toast = useToast();
  const isAdmin = roles.includes("Admin");

  const [txnPage, setTxnPage] = useState(1);
  const [entryTypeFilter, setEntryTypeFilter] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  const { data: accountsData, isLoading: accountsLoading, isError: accountsError, refetch: refetchAccounts } = useMyAccount();
  const account = accountsData?.items?.[0];
  const accountId = account?.id ?? "";

  const { data: txnData, isLoading: txnLoading } = useTransactions(accountId, txnPage, entryTypeFilter || undefined);
  const { data: recurringData, isLoading: recurringLoading } = useRecurringDeposits(accountId);

  const pauseMutation = usePauseRecurringDeposit();
  const resumeMutation = useResumeRecurringDeposit();
  const cancelMutation = useCancelRecurringDeposit();

  const handlePause = (depositId: string) => {
    pauseMutation.mutate(
      { accountId, depositId },
      {
        onSuccess: () => toast.success("Recurring deposit paused"),
        onError: () => toast.error("Failed to pause recurring deposit"),
      },
    );
  };

  const handleResume = (depositId: string) => {
    resumeMutation.mutate(
      { accountId, depositId },
      {
        onSuccess: () => toast.success("Recurring deposit resumed"),
        onError: () => toast.error("Failed to resume recurring deposit"),
      },
    );
  };

  const handleCancel = (depositId: string) => {
    cancelMutation.mutate(
      { accountId, depositId },
      {
        onSuccess: () => toast.success("Recurring deposit cancelled"),
        onError: () => toast.error("Failed to cancel recurring deposit"),
      },
    );
  };

  if (accountsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSkeleton count={3} className="h-12" />
      </div>
    );
  }

  if (accountsError) {
    return (
      <ErrorState
        name="account"
        message="Failed to load your bank account."
        onRetry={() => refetchAccounts()}
      />
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-body text-text-secondary">No bank account found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Bank Account
          </h1>
          <Badge
            label={account.status}
            variant={statusBadgeVariant(account.status)}
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
          {isAdmin && (
            <>
              <Button
                variant="secondary"
                icon={ArrowDownCircle}
                onClick={() => setDepositOpen(true)}
                className={isMobile ? "flex-1" : ""}
              >
                Deposit
              </Button>
              <Button
                variant="secondary"
                icon={ArrowUpCircle}
                onClick={() => setWithdrawOpen(true)}
                className={isMobile ? "flex-1" : ""}
              >
                Withdraw
              </Button>
            </>
          )}
          <Button
            icon={RefreshCw}
            onClick={() => setRecurringOpen(true)}
            className={isMobile ? "flex-1" : ""}
          >
            Set Up Recurring
          </Button>
        </div>
      </div>

      {/* Balance card */}
      <Card>
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted font-body">Current Balance</p>
              <p data-testid="account-balance" className="text-3xl font-bold text-text-primary font-heading">
                {formatCurrency(account.current_balance)}
              </p>
            </div>
          </div>
          <div className="sm:ml-auto flex flex-col text-right">
            <p className="text-xs text-text-muted font-body">Currency: {account.currency}</p>
            <p className="text-xs text-text-muted font-body">Updated {relativeTime(account.updated_at)}</p>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Transaction History
          </h2>
          <div className="sm:ml-auto w-full sm:w-48">
            <Select
              label=""
              name="entry-type-filter"
              options={entryTypeFilterOptions}
              value={entryTypeFilter}
              onChange={(e) => {
                setEntryTypeFilter(e.target.value);
                setTxnPage(1);
              }}
            />
          </div>
        </div>

        {txnLoading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} className="h-12" />
          </div>
        ) : !txnData?.items?.length ? (
          <div className="p-6">
            <EmptyState
              icon={Wallet}
              title="No transactions found"
              description={entryTypeFilter ? "Try adjusting your filter." : "Transactions will appear here once funds are moved."}
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
              onPageChange={setTxnPage}
            />
          </div>
        )}
      </Card>

      {/* Recurring Deposits */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Recurring Deposits
          </h2>
        </div>

        {recurringLoading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} className="h-12" />
          </div>
        ) : !recurringData?.items?.length ? (
          <div className="p-6">
            <EmptyState
              icon={RefreshCw}
              title="No recurring deposits"
              description="Set up a recurring deposit schedule to automate your savings."
            />
          </div>
        ) : isMobile ? (
          <RecurringCardList
            deposits={recurringData.items}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancel}
          />
        ) : (
          <RecurringTable
            deposits={recurringData.items}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancel}
          />
        )}
      </Card>

      {/* Dialogs */}
      <DepositWithdrawDialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        mode="deposit"
        accountId={accountId}
        currentBalance={account.current_balance}
      />
      <DepositWithdrawDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        mode="withdraw"
        accountId={accountId}
        currentBalance={account.current_balance}
      />
      <RecurringDepositDialog
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        accountId={accountId}
      />
    </div>
  );
}

/* ---- Sub-components ---- */

function TransactionTable({ transactions }: { transactions: BankTransaction[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Date</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Type</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Description</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Amount</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Balance After</th>
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
              <td className="px-6 py-3">
                <span className="text-xs font-medium text-text-secondary font-body">
                  {txn.entry_type.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-6 py-3 text-sm text-text-secondary font-body max-w-[200px] truncate">
                {txn.description || txn.reason_code}
              </td>
              <td className="px-6 py-3 text-sm font-semibold text-right font-body whitespace-nowrap">
                <span className={txn.direction === "CREDIT" ? "text-success-text" : "text-danger-text"}>
                  {txn.direction === "CREDIT" ? "+" : "-"}{formatCurrency(txn.amount)}
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

function TransactionCardList({ transactions }: { transactions: BankTransaction[] }) {
  return (
    <div className="divide-y divide-border">
      {transactions.map((txn) => (
        <div
          key={txn.id}
          data-testid="transaction-row"
          className="px-4 py-3 flex items-center gap-3"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            txn.direction === "CREDIT" ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"
          }`}>
            {txn.direction === "CREDIT" ? (
              <ArrowDownCircle size={16} className="text-success-text" />
            ) : (
              <ArrowUpCircle size={16} className="text-danger-text" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary font-body truncate">
              {txn.entry_type.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-text-muted font-body">
              {formatDate(txn.created_at)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-sm font-semibold font-body ${
              txn.direction === "CREDIT" ? "text-success-text" : "text-danger-text"
            }`}>
              {txn.direction === "CREDIT" ? "+" : "-"}{formatCurrency(txn.amount)}
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

function RecurringTable({
  deposits,
  onPause,
  onResume,
  onCancel,
}: {
  deposits: RecurringDeposit[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Source</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Amount</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Frequency</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Next Run</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Status</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted font-body uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {deposits.map((dep) => (
            <tr
              key={dep.id}
              data-testid="recurring-deposit-row"
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
                {dep.next_execution_at ? formatDate(dep.next_execution_at) : "--"}
              </td>
              <td className="px-6 py-3">
                <Badge label={dep.status} variant={statusBadgeVariant(dep.status)} />
              </td>
              <td className="px-6 py-3 text-right">
                <RecurringActions
                  deposit={dep}
                  onPause={onPause}
                  onResume={onResume}
                  onCancel={onCancel}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecurringCardList({
  deposits,
  onPause,
  onResume,
  onCancel,
}: {
  deposits: RecurringDeposit[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {deposits.map((dep) => (
        <div
          key={dep.id}
          data-testid="recurring-deposit-row"
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
              <Badge label={dep.status} variant={statusBadgeVariant(dep.status)} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <RecurringActions
              deposit={dep}
              onPause={onPause}
              onResume={onResume}
              onCancel={onCancel}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecurringActions({
  deposit,
  onPause,
  onResume,
  onCancel,
}: {
  deposit: RecurringDeposit;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {deposit.status === "ACTIVE" && (
        <button
          type="button"
          onClick={() => onPause(deposit.id)}
          className="p-1.5 rounded-button text-text-muted hover:text-warning-text hover:bg-warning transition-colors"
          title="Pause"
        >
          <Pause size={16} />
        </button>
      )}
      {deposit.status === "PAUSED" && (
        <button
          type="button"
          onClick={() => onResume(deposit.id)}
          className="p-1.5 rounded-button text-text-muted hover:text-success-text hover:bg-success transition-colors"
          title="Resume"
        >
          <Play size={16} />
        </button>
      )}
      {(deposit.status === "ACTIVE" || deposit.status === "PAUSED") && (
        <button
          type="button"
          onClick={() => onCancel(deposit.id)}
          className="p-1.5 rounded-button text-text-muted hover:text-danger-text hover:bg-danger transition-colors"
          title="Cancel"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default BankAccountPage;
