import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Calendar, FileText } from "lucide-react";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { createRecurringDepositSchema } from "./schemas";
import type { CreateRecurringDepositFormData } from "./schemas";
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
      </form>
    </Modal>
  );
}

export default RecurringDepositDialog;
