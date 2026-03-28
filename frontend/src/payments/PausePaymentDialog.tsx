import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Pause } from "lucide-react";
import type { Payment } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Textarea } from "@/ui/Textarea";
import { Button } from "@/ui/Button";
import { formatCurrency, formatDate } from "@/utils/format";
import { pauseSchema } from "./schemas";
import type { PauseFormData } from "./schemas";
import { usePausePayments } from "./hooks";

interface PausePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  loanId: string;
}

export function PausePaymentDialog({
  open,
  onClose,
  payment,
  loanId,
}: PausePaymentDialogProps) {
  const pausePayments = usePausePayments();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PauseFormData>({
    resolver: zodResolver(pauseSchema),
    defaultValues: {
      payment_ids: [payment.id],
      reason: "",
    },
  });

  const onSubmit = async (data: PauseFormData) => {
    setSubmitting(true);
    try {
      await pausePayments.mutateAsync({ loanId, data });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pause Payment"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon={Pause}
            disabled={submitting}
            isLoading={submitting}
            onClick={handleSubmit(onSubmit)}
          >
            Pause Payment
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div data-testid="pause-warning" className="bg-warning rounded-button p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning-text shrink-0 mt-0.5" />
          <p className="text-sm text-warning-text">
            Pausing a payment will not remove it from the schedule. It will be marked as paused until resumed.
          </p>
        </div>

        <div data-testid="payment-info" className="bg-background rounded-button p-4">
          <p className="text-sm font-semibold text-text-secondary">Payment</p>
          <p className="text-sm text-text-muted mt-1">
            Due {formatDate(payment.due_date)} &middot; {formatCurrency(payment.amount_due)}
          </p>
        </div>

        <input type="hidden" {...register("payment_ids.0")} />

        <Textarea
          label="Reason (optional)"
          {...register("reason")}
          error={errors.reason?.message}
        />
      </div>
    </Modal>
  );
}

export default PausePaymentDialog;
