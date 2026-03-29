import type { RecurringLoanStatus } from "@/api/types";

interface RecurringLoanStatusBadgeProps {
  status: RecurringLoanStatus;
}

const statusConfig: Record<RecurringLoanStatus, { label: string; classes: string }> = {
  ACTIVE: { label: "Active", classes: "bg-success text-success-text" },
  PAUSED: { label: "Paused", classes: "bg-warning text-warning-text" },
  CANCELLED: { label: "Cancelled", classes: "bg-gray-100 text-text-secondary" },
  COMPLETED: { label: "Completed", classes: "bg-gray-100 text-text-secondary" },
  DRAFT: { label: "Draft", classes: "bg-info text-info-text" },
  PENDING_APPROVAL: { label: "Pending Approval", classes: "bg-warning text-warning-text" },
  SUSPENDED: { label: "Suspended", classes: "bg-danger text-danger-text" },
};

export function RecurringLoanStatusBadge({ status }: RecurringLoanStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    classes: "bg-gray-100 text-text-secondary",
  };

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-1 rounded-badge px-3 py-1 text-xs font-semibold font-body ${config.classes}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

export default RecurringLoanStatusBadge;
