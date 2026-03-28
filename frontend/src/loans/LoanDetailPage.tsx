import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, CreditCard } from "lucide-react";
import { useAuth } from "@/auth/hooks";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";
import { LoanSummaryCards } from "./LoanSummaryCards";
import { CreateEditLoanModal } from "./CreateEditLoanModal";
import { useLoanDetail } from "./hooks";

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { data: loan, isLoading } = useLoanDetail(id!);

  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const isBorrower =
    roles.length === 1 && roles[0] === "Borrower";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSkeleton count={3} className="h-12" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-body text-text-secondary">Loan not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/loans")}
          className="p-2 rounded-button text-text-secondary hover:bg-background transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              data-testid="loan-title"
              className="font-heading text-2xl font-bold text-text-primary truncate"
            >
              {loan.description}
            </h1>
            <span data-testid="loan-status-badge">
              <StatusBadge status={loan.status} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isBorrower && (
            <Button
              variant="secondary"
              icon={Edit}
              onClick={() => setEditOpen(true)}
            >
              Edit Loan
            </Button>
          )}
          <Button icon={CreditCard} onClick={() => setPaymentOpen(true)}>
            Record Payment
          </Button>
        </div>
      </div>

      <LoanSummaryCards loan={loan} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div data-testid="loan-info-card">
          <Card className="p-6">
            <h2 className="font-heading text-lg font-bold text-text-primary mb-4">
              Loan Details
            </h2>
            <dl className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <dt className="font-body text-xs text-text-muted">Creditor</dt>
                <dd className="font-body text-sm text-text-primary font-medium mt-0.5">
                  {loan.creditor_name}
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-text-muted">Borrower</dt>
                <dd className="font-body text-sm text-text-primary font-medium mt-0.5">
                  {loan.borrower_name}
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-text-muted">Principal</dt>
                <dd className="font-body text-sm text-text-primary font-medium mt-0.5">
                  {formatCurrency(loan.principal)}
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-text-muted">
                  Interest Rate
                </dt>
                <dd className="font-body text-sm text-text-primary font-medium mt-0.5">
                  {loan.interest_rate}%
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-text-muted">Frequency</dt>
                <dd className="font-body text-sm text-text-primary font-medium mt-0.5">
                  {loan.repayment_frequency}
                </dd>
              </div>
              <div>
                <dt className="font-body text-xs text-text-muted">Start Date</dt>
                <dd className="font-body text-sm text-text-primary font-medium mt-0.5">
                  {formatDate(loan.start_date)}
                </dd>
              </div>
              {loan.notes && (
                <div className="col-span-2">
                  <dt className="font-body text-xs text-text-muted">Notes</dt>
                  <dd className="font-body text-sm text-text-secondary mt-0.5">
                    {loan.notes}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div data-testid="payment-schedule-card">
          <Card className="p-6">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">
            Payment Schedule
          </h2>
            <PaymentScheduleView loanId={loan.id} />
          </Card>
        </div>
      </div>

      <div data-testid="payment-history">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-4">
          Payment History
        </h2>
        <PaymentHistoryView loanId={loan.id} />
      </div>

      <CreateEditLoanModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        loan={loan}
      />

      {paymentOpen && (
        <RecordPaymentDialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          loanId={loan.id}
        />
      )}
    </div>
  );
}

function PaymentScheduleView({ loanId }: { loanId: string }) {
  void loanId;
  return (
    <p className="font-body text-sm text-text-muted">
      Payment schedule will be displayed here.
    </p>
  );
}

function PaymentHistoryView({ loanId }: { loanId: string }) {
  void loanId;
  return (
    <p className="font-body text-sm text-text-muted">
      Payment history will be displayed here.
    </p>
  );
}

function RecordPaymentDialog({
  open,
  onClose,
  loanId,
}: {
  open: boolean;
  onClose: () => void;
  loanId: string;
}) {
  void open;
  void loanId;
  return (
    <div>
      <button type="button" onClick={onClose} className="hidden">
        Close
      </button>
    </div>
  );
}

export default LoanDetailPage;
