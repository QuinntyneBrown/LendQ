import { Banknote, HandCoins, CalendarClock, AlertCircle } from "lucide-react";
import type { DashboardSummary } from "@/api/types";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { SummaryCard } from "./SummaryCard";

interface SummaryCardsProps {
  data: DashboardSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function SummaryCards({ data, isLoading, isError, onRetry }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <LoadingSkeleton className="h-24" />
        <LoadingSkeleton className="h-24" />
        <LoadingSkeleton className="h-24" />
        <LoadingSkeleton className="h-24" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState name="summary" message="Failed to load summary." onRetry={onRetry} />;
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <SummaryCard
        testId="metric-total-lent-out"
        icon={Banknote}
        label="Total Lent Out"
        value={data.total_lent_out}
        format="currency"
      />
      <SummaryCard
        testId="metric-total-owed"
        icon={HandCoins}
        label="Total Owed"
        value={data.total_owed}
        format="currency"
      />
      <SummaryCard
        testId="metric-upcoming-payments"
        icon={CalendarClock}
        label="Upcoming (7d)"
        value={data.upcoming_payments_7d}
        format="count"
      />
      <SummaryCard
        testId="metric-overdue-payments"
        icon={AlertCircle}
        label="Overdue"
        value={data.overdue_payments}
        format="count"
        variant="danger"
      />
    </div>
  );
}
