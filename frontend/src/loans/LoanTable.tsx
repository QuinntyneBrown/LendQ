import type { Loan } from "@/api/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";

interface LoanTableProps {
  loans: Loan[];
  viewMode: "creditor" | "borrower";
  onRowClick: (loan: Loan) => void;
}

export function LoanTable({ loans, viewMode, onRowClick }: LoanTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-xs font-semibold text-text-secondary font-body">
              {viewMode === "creditor" ? "Borrower" : "Creditor"}
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-text-secondary font-body">
              Description
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-text-secondary font-body">
              Principal
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-text-secondary font-body">
              Balance
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-text-secondary font-body">
              Next Due
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-text-secondary font-body">
              Status
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-text-secondary font-body">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr
              key={loan.id}
              data-testid="loan-row"
              onClick={() => onRowClick(loan)}
              className="border-b border-border hover:bg-background cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-body text-sm text-text-primary font-medium">
                {viewMode === "creditor"
                  ? loan.borrower_name
                  : loan.creditor_name}
              </td>
              <td className="px-4 py-3 font-body text-sm text-text-secondary">
                {loan.description}
              </td>
              <td className="px-4 py-3 font-body text-sm text-text-primary font-medium">
                {formatCurrency(loan.principal)}
              </td>
              <td className="px-4 py-3 font-body text-sm text-text-primary font-medium">
                {formatCurrency(loan.outstanding_balance)}
              </td>
              <td className="px-4 py-3 font-body text-sm text-text-secondary">
                {loan.start_date ? formatDate(loan.start_date) : "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={loan.status} />
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-primary text-sm font-medium font-body hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(loan);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LoanTable;
