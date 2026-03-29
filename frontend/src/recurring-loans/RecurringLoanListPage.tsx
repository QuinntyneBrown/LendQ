import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Repeat, Pause, Play, XCircle, Eye } from "lucide-react";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { Button } from "@/ui/Button";
import { Pagination } from "@/ui/Pagination";
import { EmptyState } from "@/ui/EmptyState";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { DataTable } from "@/ui/DataTable";
import { Card } from "@/ui/Card";
import { formatCurrency, formatDate } from "@/utils/format";
import { RecurringLoanStatusBadge } from "./RecurringLoanStatusBadge";
import { CreateRecurringLoanDialog } from "./CreateRecurringLoanDialog";
import { PauseResumeCancelDialog } from "./PauseResumeCancelDialog";
import { useRecurringLoans } from "./hooks";
import type { RecurringLoan } from "@/api/types";

const columns = [
  { key: "borrower", label: "Borrower" },
  { key: "amount", label: "Amount" },
  { key: "frequency", label: "Frequency" },
  { key: "status", label: "Status" },
  { key: "next_generation", label: "Next Generation" },
  { key: "total_generated", label: "Total Generated" },
  { key: "actions", label: "Actions" },
];

const frequencyLabels: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  CUSTOM: "Custom",
};

type ActionType = "pause" | "resume" | "cancel";

export function RecurringLoanListPage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionState, setActionState] = useState<{
    open: boolean;
    action: ActionType;
    loan: RecurringLoan | null;
  }>({ open: false, action: "pause", loan: null });

  const { data, isLoading, isError } = useRecurringLoans(page);

  const handleRowClick = (rl: RecurringLoan) => {
    navigate(`/loans/recurring/${rl.id}`);
  };

  const openAction = (action: ActionType, loan: RecurringLoan) => {
    setActionState({ open: true, action, loan });
  };

  const closeAction = () => {
    setActionState({ open: false, action: "pause", loan: null });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-body text-text-secondary">
          Failed to load recurring loans. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-text-primary">
            Recurring Loans
          </h1>
          <p className="text-[15px] text-text-secondary mt-1">Manage your recurring loan schedules</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Set Up Recurring Loan
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={5} className="h-16" />
      ) : !data?.items?.length ? (
        <EmptyState
          icon={Repeat}
          title="No recurring loans"
          description="Set up your first recurring loan to automate loan generation."
          action={
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Set Up Recurring Loan
            </Button>
          }
        />
      ) : (
        <>
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {data.items.map((rl) => (
                <Card key={rl.id}>
                  <button
                    type="button"
                    data-testid="recurring-loan-row"
                    onClick={() => handleRowClick(rl)}
                    className="w-full text-left p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm font-semibold text-text-primary">
                        {rl.borrower_name}
                      </span>
                      <RecurringLoanStatusBadge status={rl.status} />
                    </div>
                    <p className="font-body text-sm text-text-secondary truncate">
                      {(rl as Record<string, unknown>).description_template as string ?? "Recurring loan"}
                    </p>
                    <div className="flex items-center justify-between text-[13px] font-body text-text-muted">
                      <span>{frequencyLabels[rl.recurrence_interval] ?? rl.recurrence_interval}</span>
                      <span>{rl.total_generated} generated</span>
                    </div>
                    {rl.next_generation_at && (
                      <span className="text-[13px] font-body text-text-muted">
                        Next: {formatDate(rl.next_generation_at)}
                      </span>
                    )}
                  </button>
                  <div className="flex border-t border-border">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(rl);
                      }}
                      className="flex-1 py-2 text-center text-sm font-body font-medium text-primary"
                    >
                      View
                    </button>
                    {rl.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAction("pause", rl);
                        }}
                        className="flex-1 py-2 text-center text-sm font-body font-medium text-warning-text border-l border-border"
                      >
                        Pause
                      </button>
                    )}
                    {rl.status === "PAUSED" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAction("resume", rl);
                        }}
                        className="flex-1 py-2 text-center text-sm font-body font-medium text-success-text border-l border-border"
                      >
                        Resume
                      </button>
                    )}
                    {!["COMPLETED", "CANCELLED"].includes(rl.status) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAction("cancel", rl);
                        }}
                        className="flex-1 py-2 text-center text-sm font-body font-medium text-danger-text border-l border-border"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <DataTable
                columns={columns}
                data={data.items}
                renderRow={(rl) => (
                  <tr
                    key={rl.id}
                    data-testid="recurring-loan-row"
                    onClick={() => handleRowClick(rl)}
                    className="border-b border-border hover:bg-background transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-body text-sm font-medium text-text-primary">
                        {rl.borrower_name}
                      </div>
                      <div className="font-body text-sm text-text-muted">
                        {(rl as Record<string, unknown>).description_template as string ?? "Recurring loan"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-medium text-text-primary">
                      {formatCurrency((rl as Record<string, unknown>).principal_amount as number ?? 0)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-secondary">
                      {frequencyLabels[rl.recurrence_interval] ?? rl.recurrence_interval}
                    </td>
                    <td className="px-4 py-3">
                      <RecurringLoanStatusBadge status={rl.status} />
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-secondary">
                      {rl.next_generation_at ? formatDate(rl.next_generation_at) : "\u2014"}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-primary">
                      {rl.total_generated}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(rl);
                          }}
                          className="p-1.5 rounded-button text-text-secondary hover:bg-background transition-colors"
                          aria-label="View"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {rl.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAction("pause", rl);
                            }}
                            className="p-1.5 rounded-button text-warning-text hover:bg-warning/10 transition-colors"
                            aria-label="Pause"
                            title="Pause"
                          >
                            <Pause size={16} />
                          </button>
                        )}
                        {rl.status === "PAUSED" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAction("resume", rl);
                            }}
                            className="p-1.5 rounded-button text-success-text hover:bg-success/10 transition-colors"
                            aria-label="Resume"
                            title="Resume"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {!["COMPLETED", "CANCELLED"].includes(rl.status) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAction("cancel", rl);
                            }}
                            className="p-1.5 rounded-button text-danger-text hover:bg-danger/10 transition-colors"
                            aria-label="Cancel recurring loan"
                            title="Cancel"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              />
            </Card>
          )}

          <div className="flex justify-center">
            <Pagination
              page={data.page}
              totalPages={data.pages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <CreateRecurringLoanDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
      />

      {actionState.loan && (
        <PauseResumeCancelDialog
          open={actionState.open}
          onClose={closeAction}
          action={actionState.action}
          recurringLoan={actionState.loan}
          onSuccess={closeAction}
        />
      )}
    </div>
  );
}

export default RecurringLoanListPage;
