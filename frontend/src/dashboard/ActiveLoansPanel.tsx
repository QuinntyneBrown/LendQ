import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/ui/Card";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { useBreakpoint } from "@/layout/useBreakpoint";
import { formatCurrency, formatDate } from "@/utils/format";
import { useDashboardLoans } from "./hooks";

type Tab = "creditor" | "borrower";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-amber-100 text-amber-800",
  PAID_OFF: "bg-blue-100 text-blue-800",
  OVERDUE: "bg-red-100 text-red-800",
  DEFAULTED: "bg-gray-100 text-gray-800",
};

export function ActiveLoansPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("creditor");
  const { data, isLoading, isError, refetch } = useDashboardLoans(activeTab);
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();

  return (
    <Card className="p-5">
      <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
        Active Loans
      </h2>

      <div className="flex gap-1 mb-4 border-b border-border" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "creditor"}
          onClick={() => setActiveTab("creditor")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "creditor"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Loans I Gave
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "borrower"}
          onClick={() => setActiveTab("borrower")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "borrower"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Loans I Owe
        </button>
      </div>

      {isLoading && <LoadingSkeleton className="h-12" count={3} />}

      {isError && (
        <ErrorState
          name="loans"
          message="Failed to load loans."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {data.map((loan) => (
                <div
                  key={loan.id}
                  data-testid="loan-card"
                  onClick={() => navigate(`/loans/${loan.id}`)}
                  className="border border-border rounded-card p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-text-primary">
                      {loan.person_name}
                    </span>
                    <span
                      data-testid="status-badge"
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[loan.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>{formatCurrency(loan.amount)}</span>
                    <span>Due {formatDate(loan.next_due)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Next Due</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.map((loan) => (
                  <tr
                    key={loan.id}
                    data-testid="active-loan-row"
                    onClick={() => navigate(`/loans/${loan.id}`)}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 text-text-primary">{loan.person_name}</td>
                    <td className="py-3 text-text-primary">{formatCurrency(loan.amount)}</td>
                    <td className="py-3 text-text-secondary">{formatDate(loan.next_due)}</td>
                    <td className="py-3">
                      <span
                        data-testid="status-badge"
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[loan.status] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-primary text-sm font-medium">View</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Card>
  );
}
