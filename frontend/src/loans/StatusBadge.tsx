import type { LoanStatus, PaymentStatus } from "@/api/types";

interface StatusBadgeProps {
  status: LoanStatus | PaymentStatus;
}

const statusConfig: Record<
  LoanStatus | PaymentStatus,
  { label: string; classes: string }
> = {
  ACTIVE: { label: "Active", classes: "bg-success text-success-text" },
  OVERDUE: { label: "Overdue", classes: "bg-danger text-danger-text" },
  PAUSED: { label: "Paused", classes: "bg-warning text-warning-text" },
  PAID_OFF: { label: "Paid Off", classes: "bg-info text-info-text" },
  DEFAULTED: { label: "Defaulted", classes: "bg-danger text-danger-text" },
  SCHEDULED: { label: "Scheduled", classes: "bg-gray-100 text-text-secondary" },
  RESCHEDULED: { label: "Rescheduled", classes: "bg-info text-info-text" },
  PAID: { label: "Paid", classes: "bg-success text-success-text" },
  PARTIAL: { label: "Partial", classes: "bg-orange-100 text-orange-600" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
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

export default StatusBadge;
