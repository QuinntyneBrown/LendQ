import { DollarSign, CheckCircle, TrendingDown, Calendar } from "lucide-react";
import type { Loan } from "@/api/types";
import { MetricCard } from "@/ui/MetricCard";
import { formatDate } from "@/utils/format";

interface LoanSummaryCardsProps {
  loan: Loan;
}

export function LoanSummaryCards({ loan }: LoanSummaryCardsProps) {
  const totalPaid = Number(loan.principal) - Number(loan.outstanding_balance);
  const nextPayment = loan.start_date ? formatDate(loan.start_date) : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        testId="metric-principal"
        icon={DollarSign}
        label="Principal"
        value={loan.principal}
        format="currency"
      />
      <MetricCard
        testId="metric-total-paid"
        icon={CheckCircle}
        label="Total Paid"
        value={totalPaid}
        format="currency"
      />
      <MetricCard
        testId="metric-outstanding"
        icon={TrendingDown}
        label="Outstanding"
        value={loan.outstanding_balance}
        format="currency"
      />
      <MetricCard
        testId="metric-next-payment"
        icon={Calendar}
        label="Next Payment"
        value={nextPayment}
        format="count"
      />
    </div>
  );
}

export default LoanSummaryCards;
