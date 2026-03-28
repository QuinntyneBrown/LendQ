interface BadgeProps {
  label: string;
  variant?:
    | "active"
    | "overdue"
    | "paused"
    | "paid_off"
    | "scheduled"
    | "rescheduled"
    | "partial"
    | "default";
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  active: "bg-success text-success-text",
  overdue: "bg-danger text-danger-text",
  paused: "bg-warning text-warning-text",
  paid_off: "bg-info text-info-text",
  scheduled: "bg-gray-100 text-text-secondary",
  rescheduled: "bg-info text-info-text",
  partial: "bg-orange-100 text-orange-600",
  default: "bg-gray-100 text-text-secondary",
};

export function Badge({
  label,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-badge px-3 py-1 text-xs font-semibold font-body ${variantClasses[variant]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

export default Badge;
