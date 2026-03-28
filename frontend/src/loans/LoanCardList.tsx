import type { Loan } from "@/api/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";

interface LoanCardListProps {
  loans: Loan[];
  viewMode: "creditor" | "borrower";
  onCardClick: (loan: Loan) => void;
}

export function LoanCardList({
  loans,
  viewMode,
  onCardClick,
}: LoanCardListProps) {
  return (
    <div className="flex flex-col gap-3">
      {loans.map((loan) => (
        <div
          key={loan.id}
          data-testid="loan-card"
          onClick={() => onCardClick(loan)}
          className="bg-surface rounded-card border border-border p-4 cursor-pointer hover:border-primary transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-body text-sm font-medium text-text-primary">
                {viewMode === "creditor"
                  ? loan.borrower_name
                  : loan.creditor_name}
              </p>
              <p className="font-body text-xs text-text-secondary mt-0.5">
                {loan.description}
              </p>
            </div>
            <StatusBadge status={loan.status} />
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-4">
              <div>
                <p className="font-body text-[11px] text-text-muted">
                  Principal
                </p>
                <p className="font-body text-sm font-semibold text-text-primary">
                  {formatCurrency(loan.principal)}
                </p>
              </div>
              <div>
                <p className="font-body text-[11px] text-text-muted">
                  Balance
                </p>
                <p className="font-body text-sm font-semibold text-text-primary">
                  {formatCurrency(loan.outstanding_balance)}
                </p>
              </div>
            </div>
            <p className="font-body text-xs text-text-secondary">
              Due: {loan.start_date ? formatDate(loan.start_date) : "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoanCardList;
