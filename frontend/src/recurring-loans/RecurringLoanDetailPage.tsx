import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  Edit,
  Layers,
  CheckCircle,
  Banknote,
  Calendar,
  Send,
  Pause,
  Play,
  XCircle,
  Eye,
} from "lucide-react";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { useToast } from "@/notifications/useToast";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { MetricCard } from "@/ui/MetricCard";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { DataTable } from "@/ui/DataTable";
import { Pagination } from "@/ui/Pagination";
import { EmptyState } from "@/ui/EmptyState";
import { formatCurrency, formatDate } from "@/utils/format";
import { RecurringLoanStatusBadge } from "./RecurringLoanStatusBadge";
import { CreateRecurringLoanDialog } from "./CreateRecurringLoanDialog";
import { PauseResumeCancelDialog } from "./PauseResumeCancelDialog";
import {
  useRecurringLoan,
  useGeneratedLoans,
  useSubmitForApproval,
} from "./hooks";

const generatedColumns = [
  { key: "sequence", label: "#" },
  { key: "start_date", label: "Start Date" },
  { key: "status", label: "Status" },
  { key: "principal", label: "Principal" },
  { key: "outstanding", label: "Outstanding" },
  { key: "actions", label: "Actions" },
];

type ActionType = "pause" | "resume" | "cancel";

const EDITABLE_STATUSES = ["DRAFT", "PAUSED", "SUSPENDED"];
const NON_TERMINAL_STATUSES = ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "PAUSED", "SUSPENDED"];

export function RecurringLoanDetailPage() {
  const { recurringId } = useParams<{ recurringId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const { data: recurringLoan, isLoading, isError } = useRecurringLoan(recurringId!);
  const [genPage, setGenPage] = useState(1);
  const { data: generatedData } = useGeneratedLoans(recurringId!, genPage);

  const [editOpen, setEditOpen] = useState(false);
  const [actionState, setActionState] = useState<{
    open: boolean;
    action: ActionType;
  }>({ open: false, action: "pause" });

  const submitForApproval = useSubmitForApproval();
  const toast = useToast();

  const openAction = (action: ActionType) => {
    setActionState({ open: true, action });
  };

  const closeAction = () => {
    setActionState({ open: false, action: "pause" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSkeleton count={3} className="h-12" />
      </div>
    );
  }

  if (isError || !recurringLoan) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-body text-text-secondary">
          Recurring loan not found.
        </p>
      </div>
    );
  }

  const canEdit = EDITABLE_STATUSES.includes(recurringLoan.status);
  const canSubmit = recurringLoan.status === "DRAFT";
  const canPause = recurringLoan.status === "ACTIVE";
  const canResume = recurringLoan.status === "PAUSED";
  const canCancel = NON_TERMINAL_STATUSES.includes(recurringLoan.status);

  const template = (recurringLoan as Record<string, unknown>).template as Record<string, unknown> | undefined;
  const principalAmount = template ? Number(template.principal_amount) : 0;

  // Compute metrics
  const totalGenerated = recurringLoan.total_generated;
  // Active loans count - approximate from generated data
  const activeLoans = generatedData?.items?.length ?? 0;
  const totalDisbursed = principalAmount * totalGenerated;
  const nextGeneration = recurringLoan.next_generation_at
    ? formatDate(recurringLoan.next_generation_at)
    : "\u2014";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {/* Back breadcrumb */}
        {isMobile ? (
          <button
            type="button"
            onClick={() => navigate("/loans/recurring")}
            className="flex items-center gap-1 text-text-muted text-[13px] font-medium w-fit"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
            Recurring Loans
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/loans/recurring")}
            className="flex items-center gap-1 text-text-secondary text-sm font-medium w-fit hover:text-text-primary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
            Recurring Loans
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1
              data-testid="recurring-loan-title"
              className="font-heading text-[22px] sm:text-[28px] font-bold text-text-primary"
            >
              {(template?.description_template as string) ?? `Recurring Loan`}
            </h1>
            <span
              data-testid="recurring-loan-status"
              className="flex-shrink-0"
            >
              <RecurringLoanStatusBadge status={recurringLoan.status} />
            </span>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0 flex-wrap">
            {canEdit && (
              <Button
                variant="secondary"
                icon={Edit}
                onClick={() => setEditOpen(true)}
              >
                {isMobile ? "Edit" : "Edit"}
              </Button>
            )}
            {canSubmit && (
              <Button
                icon={Send}
                onClick={() => submitForApproval.mutate(recurringLoan.id, {
                  onSuccess: () => toast.success("Recurring loan submitted for approval"),
                  onError: () => toast.error("Failed to submit for approval"),
                })}
                isLoading={submitForApproval.isPending}
              >
                Submit for Approval
              </Button>
            )}
            {canPause && (
              <Button
                variant="secondary"
                icon={Pause}
                onClick={() => openAction("pause")}
              >
                Pause
              </Button>
            )}
            {canResume && (
              <Button
                icon={Play}
                onClick={() => openAction("resume")}
              >
                Resume
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                icon={XCircle}
                onClick={() => openAction("cancel")}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          testId="metric-total-generated"
          icon={Layers}
          label="Total Generated"
          value={totalGenerated}
          format="count"
        />
        <MetricCard
          testId="metric-active-loans"
          icon={CheckCircle}
          label="Active Loans"
          value={activeLoans}
          format="count"
        />
        <MetricCard
          testId="metric-total-disbursed"
          icon={Banknote}
          label="Total Disbursed"
          value={totalDisbursed}
          format="currency"
        />
        <MetricCard
          testId="metric-next-generation"
          icon={Calendar}
          label="Next Generation"
          value={nextGeneration}
          format="count"
        />
      </div>

      {/* Loan Details Card */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Recurring Loan Details
          </h2>
        </div>
        <dl className="flex flex-col divide-y divide-border">
          <div className="flex justify-between px-6 py-3">
            <dt className="font-body text-[13px] font-medium text-text-muted">Borrower</dt>
            <dd className="font-body text-sm font-medium text-text-primary">
              {recurringLoan.borrower_name}
            </dd>
          </div>
          <div className="flex justify-between px-6 py-3">
            <dt className="font-body text-[13px] font-medium text-text-muted">Principal</dt>
            <dd className="font-body text-sm font-medium text-text-primary">
              {formatCurrency(principalAmount)}
            </dd>
          </div>
          {template?.interest_rate_percent != null && (
            <div className="flex justify-between px-6 py-3">
              <dt className="font-body text-[13px] font-medium text-text-muted">Interest Rate</dt>
              <dd className="font-body text-sm font-medium text-text-primary">
                {Number(template.interest_rate_percent)}%
              </dd>
            </div>
          )}
          <div className="flex justify-between px-6 py-3">
            <dt className="font-body text-[13px] font-medium text-text-muted">Recurrence</dt>
            <dd className="font-body text-sm font-medium text-text-primary">
              {recurringLoan.recurrence_interval}
            </dd>
          </div>
          <div className="flex justify-between px-6 py-3">
            <dt className="font-body text-[13px] font-medium text-text-muted">Start Date</dt>
            <dd className="font-body text-sm font-medium text-text-primary">
              {formatDate(recurringLoan.start_date)}
            </dd>
          </div>
          {recurringLoan.end_date && (
            <div className="flex justify-between px-6 py-3">
              <dt className="font-body text-[13px] font-medium text-text-muted">End Date</dt>
              <dd className="font-body text-sm font-medium text-text-primary">
                {formatDate(recurringLoan.end_date)}
              </dd>
            </div>
          )}
          {recurringLoan.max_occurrences != null && (
            <div className="flex justify-between px-6 py-3">
              <dt className="font-body text-[13px] font-medium text-text-muted">Max Occurrences</dt>
              <dd className="font-body text-sm font-medium text-text-primary">
                {recurringLoan.max_occurrences}
              </dd>
            </div>
          )}
          {recurringLoan.last_failure_code && (
            <div className="flex justify-between px-6 py-3">
              <dt className="font-body text-[13px] font-medium text-text-muted">Last Failure</dt>
              <dd className="font-body text-sm font-medium text-danger-text">
                {recurringLoan.last_failure_code}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Generated Loans Table */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Generated Loans
          </h2>
        </div>
        {!generatedData?.items?.length ? (
          <div className="p-6">
            <EmptyState
              icon={Layers}
              title="No generated loans yet"
              description="Loans will appear here as they are automatically generated."
            />
          </div>
        ) : isMobile ? (
          <div className="flex flex-col divide-y divide-border">
            {generatedData.items.map((gen) => (
              <button
                key={gen.id}
                type="button"
                data-testid="generated-loan-row"
                onClick={() => navigate(`/loans/${gen.loan_id}`)}
                className="w-full text-left p-4 flex flex-col gap-1.5 hover:bg-background transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-semibold text-text-primary">
                    #{gen.sequence}
                  </span>
                  <span className="font-body text-[13px] text-text-muted">
                    {formatDate(gen.scheduled_for_date)}
                  </span>
                </div>
                <span className="font-body text-[13px] text-text-muted">
                  Generated {formatDate(gen.generated_at)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <DataTable
              columns={generatedColumns}
              data={generatedData.items}
              renderRow={(gen) => (
                <tr
                  key={gen.id}
                  data-testid="generated-loan-row"
                  onClick={() => navigate(`/loans/${gen.loan_id}`)}
                  className="border-b border-border hover:bg-background transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-body text-sm font-medium text-text-primary">
                    {gen.sequence}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">
                    {formatDate(gen.scheduled_for_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-badge px-3 py-1 text-xs font-semibold font-body bg-success text-success-text">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                      Generated
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm font-medium text-text-primary">
                    {formatCurrency(principalAmount)}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">
                    {"\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/loans/${gen.loan_id}`);
                      }}
                      className="p-1.5 rounded-button text-text-secondary hover:bg-background transition-colors"
                      aria-label="View loan"
                      title="View loan"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              )}
            />
            <div className="flex justify-center py-4">
              <Pagination
                page={generatedData.page}
                totalPages={generatedData.pages}
                onPageChange={setGenPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* Edit Dialog */}
      <CreateRecurringLoanDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => setEditOpen(false)}
        recurringLoan={recurringLoan}
      />

      {/* Action Dialogs */}
      <PauseResumeCancelDialog
        open={actionState.open}
        onClose={closeAction}
        action={actionState.action}
        recurringLoan={recurringLoan}
        onSuccess={closeAction}
      />
    </div>
  );
}

export default RecurringLoanDetailPage;
