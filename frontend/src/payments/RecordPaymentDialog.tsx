import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Calendar, FileText, Check } from "lucide-react";
import type { Payment } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Button } from "@/ui/Button";
import { formatCurrency, formatDate } from "@/utils/format";
import { recordPaymentSchema } from "./schemas";
import type { RecordPaymentFormData } from "./schemas";
import { useRecordPayment } from "./hooks";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  loanId: string;
  outstandingBalance: number;
}

const methodOptions = [
  { value: "", label: "Select method" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function RecordPaymentDialog({
  open,
  onClose,
  payment,
  loanId,
  outstandingBalance,
}: RecordPaymentDialogProps) {
  const recordPayment = useRecordPayment();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amount: payment.amount_due,
      date: new Date().toISOString().split("T")[0],
      method: "",
      notes: "",
    },
  });

  const watchedAmount = watch("amount");
  const remaining = outstandingBalance - (Number(watchedAmount) || 0);

  const onSubmit = async (data: RecordPaymentFormData) => {
    setSubmitting(true);
    try {
      await recordPayment.mutateAsync({
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
      title="Record Payment"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon={Check}
            disabled={submitting}
            isLoading={submitting}
            onClick={handleSubmit(onSubmit)}
          >
            Record Payment
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div data-testid="scheduled-info" className="bg-background rounded-button p-4">
          <p className="text-sm font-semibold text-text-secondary">Scheduled Payment</p>
          <p className="text-sm text-text-muted mt-1">
            Due {formatDate(payment.due_date)} &middot; {formatCurrency(payment.amount_due)}
          </p>
        </div>

        <Input
          label="Payment Amount"
          {...register("amount", { valueAsNumber: true })}
          type="number"
          step="0.01"
          icon={DollarSign}
          error={errors.amount?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payment Date"
            {...register("date")}
            type="date"
            icon={Calendar}
            error={errors.date?.message}
          />
          <Select
            label="Payment Method"
            name="method"
            options={methodOptions}
            value={watch("method")}
            onChange={(e) => {
              const event = e as React.ChangeEvent<HTMLSelectElement>;
              void register("method").onChange(event);
            }}
          />
        </div>

        <div data-testid="balance-preview" className="bg-[#F0FDF4] rounded-button p-4">
          <p className="text-sm font-semibold text-text-secondary">Remaining Balance</p>
          <p className="text-lg font-bold text-text-primary mt-1">
            {formatCurrency(Math.max(remaining, 0))}
          </p>
          {Number(watchedAmount) > payment.amount_due && (
            <p className="text-xs text-text-muted mt-1">
              Excess amount will be applied to the outstanding balance.
            </p>
          )}
        </div>

        <Input
          label="Notes (optional)"
          {...register("notes")}
          icon={FileText}
          error={errors.notes?.message}
        />
      </div>
    </Modal>
  );
}

export default RecordPaymentDialog;
