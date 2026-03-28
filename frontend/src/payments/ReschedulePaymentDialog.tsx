import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import type { Payment } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Textarea } from "@/ui/Textarea";
import { Button } from "@/ui/Button";
import { formatCurrency, formatDate } from "@/utils/format";
import { rescheduleSchema } from "./schemas";
import type { RescheduleFormData } from "./schemas";
import { useReschedulePayment } from "./hooks";

interface ReschedulePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  loanId: string;
}

export function ReschedulePaymentDialog({
  open,
  onClose,
  payment,
  loanId,
}: ReschedulePaymentDialogProps) {
  const reschedulePayment = useReschedulePayment();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      new_date: "",
      reason: "",
    },
  });

  const onSubmit = async (data: RescheduleFormData) => {
    setSubmitting(true);
    try {
      await reschedulePayment.mutateAsync({
        paymentId: payment.id,
        loanId,
        data,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule Payment"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon={Calendar}
            disabled={submitting}
            isLoading={submitting}
            onClick={handleSubmit(onSubmit)}
          >
            Reschedule
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div data-testid="current-payment-info" className="bg-background rounded-button p-4">
          <p className="text-sm font-semibold text-text-secondary">Current Payment</p>
          <p className="text-sm text-text-muted mt-1">
            Due {formatDate(payment.due_date)} &middot; {formatCurrency(payment.amount_due)}
          </p>
        </div>

        <Input
          label="New Payment Date"
          {...register("new_date")}
          type="date"
          icon={Calendar}
          error={errors.new_date?.message}
        />

        <Textarea
          label="Reason (optional)"
          {...register("reason")}
          error={errors.reason?.message}
        />
      </div>
    </Modal>
  );
}

export default ReschedulePaymentDialog;
