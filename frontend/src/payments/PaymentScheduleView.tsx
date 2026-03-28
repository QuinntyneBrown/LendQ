import { useState } from "react";
import { Calendar } from "lucide-react";
import type { Payment } from "@/api/types";
import { StatusBadge } from "@/loans/StatusBadge";
import { Button } from "@/ui/Button";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { EmptyState } from "@/ui/EmptyState";
import { formatCurrency, formatDate } from "@/utils/format";
import { usePaymentSchedule } from "./hooks";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { ReschedulePaymentDialog } from "./ReschedulePaymentDialog";
import { PausePaymentDialog } from "./PausePaymentDialog";

interface PaymentScheduleViewProps {
  loanId: string;
  userRole?: string;
}

type DialogType = "record" | "reschedule" | "pause" | null;

export function PaymentScheduleView({ loanId }: PaymentScheduleViewProps) {
  const { data: payments, isLoading, isError } = usePaymentSchedule(loanId);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const openDialog = (type: DialogType, payment: Payment) => {
    setSelectedPayment(payment);
    setActiveDialog(type);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedPayment(null);
  };

  const handleResume = (payment: Payment) => {
    openDialog("pause", payment);
  };

  if (isLoading) return <LoadingSkeleton count={5} />;
  if (isError) return <ErrorState name="schedule" message="Failed to load payment schedule" />;
  if (!payments || payments.length === 0) return <EmptyState icon={Calendar} title="No Payments" description="No payments scheduled" />;

  const outstandingBalance = payments
    .filter((p) => p.status !== "PAID")
    .reduce((sum, p) => sum + p.amount_due - p.amount_paid, 0);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted uppercase tracking-wider">
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 pr-4 font-medium">Amount</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => (
              <tr key={payment.id} data-testid="payment-row" className="text-sm">
                <td className="py-3 pr-4">
                  {payment.original_due_date ? (
                    <div>
                      <span
                        data-testid="original-date"
                        style={{ textDecorationLine: "line-through" }}
                        className="text-text-muted text-xs"
                      >
                        {formatDate(payment.original_due_date)}
                      </span>
                      <br />
                      <span className="text-text-primary">{formatDate(payment.due_date)}</span>
                    </div>
                  ) : (
                    <span className="text-text-primary">{formatDate(payment.due_date)}</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-text-primary font-medium">
                  {formatCurrency(payment.amount_due)}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {(payment.status === "SCHEDULED" || payment.status === "OVERDUE" || payment.status === "RESCHEDULED") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDialog("record", payment)}
                      >
                        Record
                      </Button>
                    )}
                    {(payment.status === "SCHEDULED" || payment.status === "OVERDUE") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDialog("reschedule", payment)}
                      >
                        Reschedule
                      </Button>
                    )}
                    {payment.status === "SCHEDULED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDialog("pause", payment)}
                      >
                        Pause
                      </Button>
                    )}
                    {payment.status === "PAUSED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleResume(payment)}
                      >
                        Resume
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPayment && activeDialog === "record" && (
        <RecordPaymentDialog
          open
          onClose={closeDialog}
          payment={selectedPayment}
          loanId={loanId}
          outstandingBalance={outstandingBalance}
        />
      )}
      {selectedPayment && activeDialog === "reschedule" && (
        <ReschedulePaymentDialog
          open
          onClose={closeDialog}
          payment={selectedPayment}
          loanId={loanId}
        />
      )}
      {selectedPayment && activeDialog === "pause" && (
        <PausePaymentDialog
          open
          onClose={closeDialog}
          payment={selectedPayment}
          loanId={loanId}
        />
      )}
    </>
  );
}

export default PaymentScheduleView;
