import type { LucideIcon } from "lucide-react";
import { MetricCard } from "@/ui/MetricCard";

interface SummaryCardProps {
  testId: string;
  icon: LucideIcon;
  label: string;
  value: number;
  format: "currency" | "count";
  variant?: "default" | "danger";
}

export function SummaryCard({
  testId,
  icon,
  label,
  value,
  format,
  variant = "default",
}: SummaryCardProps) {
  return (
    <MetricCard
      testId={testId}
      icon={icon}
      label={label}
      value={value}
      format={format}
      variant={variant}
    />
  );
}
