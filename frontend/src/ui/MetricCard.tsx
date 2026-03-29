import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface MetricCardProps {
  testId: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  format?: "currency" | "count";
  variant?: "default" | "danger";
}

export function MetricCard({
  testId,
  icon: Icon,
  label,
  value,
  format = "count",
  variant = "default",
}: MetricCardProps) {
  const displayValue =
    format === "currency"
      ? formatCurrency(Number(value))
      : String(value);

  return (
    <div
      data-testid={testId}
      className="bg-surface rounded-card border border-border p-5 flex items-start gap-4"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-primary-light rounded-button flex-shrink-0">
        <Icon size={20} className="text-primary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-body text-[13px] font-medium text-text-secondary">
          {label}
        </span>
        <span
          className={`font-heading text-[22px] sm:text-[28px] font-extrabold leading-tight truncate ${variant === "danger" ? "text-danger-text" : "text-text-primary"}`}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}

export default MetricCard;
