import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMonths, format } from "date-fns";
import { DollarSign, Calendar, FileText } from "lucide-react";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { createRecurringDepositSchema } from "./schemas";
import type { CreateRecurringDepositFormData } from "./schemas";
import { formatCurrency } from "@/utils/format";
import { useCreateRecurringDeposit } from "./hooks";

interface RecurringDepositDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

const frequencyOptions = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

export function RecurringDepositDialog({
  open,
  onClose,
  accountId,
}: RecurringDepositDialogProps) {
  const createMutation = useCreateRecurringDeposit();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateRecurringDepositFormData>({
    resolver: zodResolver(createRecurringDepositSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      source_description: "",
      frequency: "MONTHLY",
      start_date: "",
      end_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: undefined as unknown as number,
        source_description: "",
        frequency: "MONTHLY",
        start_date: "",
        end_date: "",
      });
    }
  }, [open, reset]);

  const onSubmit = (data: CreateRecurringDepositFormData) => {
    createMutation.mutate(
      {
        accountId,
        amount: String(data.amount),
        source_description: data.source_description,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Recurring deposit schedule created successfully");
          onClose();
        },
        onError: () => {
          toast.error("Failed to create recurring deposit schedule");
        },
      },
    );
  };

  const watchedAmount = watch("amount");
  const watchedStartDate = watch("start_date");
  const watchedFrequency = watch("frequency");

  const nextDeposits = useMemo(() => {
    if (!watchedAmount || watchedAmount <= 0 || !watchedStartDate || !watchedFrequency) {
      return [];
    }
    const dates: Date[] = [];
    const start = new Date(watchedStartDate + "T00:00:00");
    if (isNaN(start.getTime())) return [];
    for (let i = 0; i < 3; i++) {
      let d: Date;
      if (watchedFrequency === "WEEKLY") {
        d = addDays(start, 7 * i);
      } else if (watchedFrequency === "BIWEEKLY") {
        d = addDays(start, 14 * i);
      } else {
        d = addMonths(start, i);
      }
      dates.push(d);
    }
    return dates;
  }, [watchedAmount, watchedStartDate, watchedFrequency]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set Up Recurring Deposit"
      maxWidth="max-w-[520px]"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            isLoading={createMutation.isPending}
            disabled={createMutation.isPending}
          >
            Create Schedule
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Amount"
          icon={DollarSign}
          type="number"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
        />

        <Input
          label="Source Description"
          icon={FileText}
          {...register("source_description")}
          error={errors.source_description?.message}
        />

        <Select
          label="Frequency"
          name="frequency"
          options={frequencyOptions}
          value={watch("frequency")}
          onChange={(e) =>
            setValue(
              "frequency",
              e.target.value as CreateRecurringDepositFormData["frequency"],
              { shouldValidate: true },
            )
          }
          error={errors.frequency?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            icon={Calendar}
            type="date"
            {...register("start_date")}
            error={errors.start_date?.message}
          />
          <Input
            label="End Date (optional)"
            icon={Calendar}
            type="date"
            {...register("end_date")}
            error={errors.end_date?.message}
          />
        </div>

        {nextDeposits.length > 0 && (
          <div
            data-testid="next-deposits-preview"
            className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-4"
          >
            <h3 className="font-body text-sm font-bold text-text-primary mb-3">
              Next 3 Deposits
            </h3>
            <ul className="flex flex-col gap-2">
              {nextDeposits.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between font-body text-sm"
                >
                  <span className="text-text-secondary">
                    {format(d, "MMM dd, yyyy")}
                  </span>
                  <span className="font-medium text-text-primary">
                    {formatCurrency(watchedAmount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default RecurringDepositDialog;
