import { useState } from "react";
import { FileText } from "lucide-react";
import { usePaymentHistory } from "./hooks";
import { ChangeLogEntry } from "./ChangeLogEntry";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { EmptyState } from "@/ui/EmptyState";

interface PaymentHistoryViewProps {
  loanId: string;
}

const filterOptions = [
  { value: "all", label: "All" },
  { value: "payment", label: "Payment" },
  { value: "reschedule", label: "Reschedule" },
  { value: "pause", label: "Pause" },
  { value: "adjustment", label: "Adjustment" },
];

export function PaymentHistoryView({ loanId }: PaymentHistoryViewProps) {
  const { data: history, isLoading, isError } = usePaymentHistory(loanId);
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? history
      : history?.filter((e) => e.entity_type.toLowerCase() === filter);

  return (
    <div data-testid="payment-history">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-bold text-text-primary">Payment History</h3>
        <select
          data-testid="history-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-input border border-border-strong px-3 py-1.5 text-sm font-body text-text-primary"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingSkeleton count={4} />}
      {isError && <ErrorState name="history" message="Failed to load payment history" />}
      {filtered && filtered.length === 0 && (
        <EmptyState icon={FileText} title="No History" description="No history entries found" />
      )}
      {filtered && filtered.length > 0 && (
        <div className="divide-y divide-border">
          {filtered.map((entry) => (
            <ChangeLogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PaymentHistoryView;
