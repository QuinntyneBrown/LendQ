import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, DollarSign, Percent, Calendar, Hash } from "lucide-react";
import type { RecurringLoan } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { BorrowerSelect } from "@/loans/BorrowerSelect";
import { apiGet } from "@/api/client";
import type { User } from "@/api/types";
import { createRecurringLoanSchema, type CreateRecurringLoanFormData } from "./schemas";
import { useCreateRecurringLoan, useUpdateRecurringLoan } from "./hooks";

interface CreateRecurringLoanDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  recurringLoan?: RecurringLoan & { template?: Record<string, unknown> };
}

const frequencyOptions = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CUSTOM", label: "Custom" },
];

export function CreateRecurringLoanDialog({
  open,
  onClose,
  onSuccess,
  recurringLoan,
}: CreateRecurringLoanDialogProps) {
  const isEdit = !!recurringLoan;
  const createMutation = useCreateRecurringLoan();
  const updateMutation = useUpdateRecurringLoan();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateRecurringLoanFormData>({
    resolver: zodResolver(createRecurringLoanSchema),
    defaultValues: {
      borrower_id: "",
      description_template: "",
      principal_amount: undefined as unknown as number,
      interest_rate_percent: undefined,
      repayment_frequency: "MONTHLY",
      installment_count: undefined as unknown as number,
      recurrence_interval: "MONTHLY",
      start_date: "",
      end_date: undefined,
      max_occurrences: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (recurringLoan) {
        const tpl = recurringLoan.template;
        reset({
          borrower_id: recurringLoan.borrower_id,
          description_template: (tpl?.description_template as string) ?? "",
          principal_amount: Number(tpl?.principal_amount ?? 0),
          interest_rate_percent: tpl?.interest_rate_percent != null ? Number(tpl.interest_rate_percent) : undefined,
          repayment_frequency: (tpl?.repayment_frequency as CreateRecurringLoanFormData["repayment_frequency"]) ?? "MONTHLY",
          installment_count: Number(tpl?.installment_count ?? 1),
          recurrence_interval: recurringLoan.recurrence_interval,
          start_date: recurringLoan.start_date,
          end_date: recurringLoan.end_date ?? undefined,
          max_occurrences: recurringLoan.max_occurrences ?? undefined,
        });
      } else {
        reset({
          borrower_id: "",
          description_template: "",
          principal_amount: undefined as unknown as number,
          interest_rate_percent: undefined,
          repayment_frequency: "MONTHLY",
          installment_count: undefined as unknown as number,
          recurrence_interval: "MONTHLY",
          start_date: "",
          end_date: undefined,
          max_occurrences: undefined,
        });
        // Auto-select first available borrower
        apiGet<{ items: User[] }>("/users/borrowers?search=")
          .then((data) => {
            if (data.items?.length > 0) {
              setValue("borrower_id", data.items[0].id, { shouldValidate: true });
            }
          })
          .catch(() => {
            // Silently ignore - user can still select manually
          });
      }
    }
  }, [open, recurringLoan, reset, setValue]);

  const borrowerId = watch("borrower_id");

  const onSubmit = (data: CreateRecurringLoanFormData) => {
    const payload: Record<string, unknown> = { ...data };
    // Remove undefined/null optional fields so the backend doesn't reject them
    if (data.interest_rate_percent == null) delete payload.interest_rate_percent;
    if (!data.end_date) delete payload.end_date;
    if (data.max_occurrences == null) delete payload.max_occurrences;

    if (isEdit) {
      updateMutation.mutate(
        {
          id: recurringLoan.id,
          ...payload,
          expected_version: recurringLoan.version,
        } as Record<string, unknown> & { id: string },
        {
          onSuccess: () => {
            toast.success("Recurring loan updated");
            onSuccess?.();
            onClose();
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Recurring loan created");
          onSuccess?.();
          onClose();
        },
        onError: (err: unknown) => {
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create recurring loan";
          toast.error(message);
        },
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Recurring Loan" : "Set Up Recurring Loan"}
      maxWidth="max-w-[600px]"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            isLoading={isPending}
            disabled={isPending}
          >
            {isEdit ? "Save Changes" : "Create Recurring Loan"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {!isEdit && (
          <BorrowerSelect
            value={borrowerId}
            onChange={(userId) => {
              setValue("borrower_id", userId, { shouldValidate: true });
            }}
            error={errors.borrower_id?.message}
          />
        )}

        <Input
          label="Description Template"
          name="description_template"
          icon={FileText}
          {...register("description_template")}
          error={errors.description_template?.message}
          placeholder="e.g. Monthly allowance loan for {month}"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Principal Amount"
            name="principal_amount"
            icon={DollarSign}
            type="number"
            step="0.01"
            {...register("principal_amount", { valueAsNumber: true })}
            error={errors.principal_amount?.message}
          />
          <Input
            label="Interest Rate % (optional)"
            name="interest_rate_percent"
            icon={Percent}
            type="number"
            step="0.01"
            {...register("interest_rate_percent", { valueAsNumber: true })}
            error={errors.interest_rate_percent?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Repayment Frequency"
            name="repayment_frequency"
            options={frequencyOptions}
            value={watch("repayment_frequency")}
            onChange={(e) =>
              setValue(
                "repayment_frequency",
                e.target.value as CreateRecurringLoanFormData["repayment_frequency"],
                { shouldValidate: true },
              )
            }
            error={errors.repayment_frequency?.message}
          />
          <Input
            label="Installment Count"
            name="installment_count"
            icon={Hash}
            type="number"
            step="1"
            {...register("installment_count", { valueAsNumber: true })}
            error={errors.installment_count?.message}
          />
        </div>

        <Select
          label="Recurrence Interval"
          name="recurrence_interval"
          options={frequencyOptions}
          value={watch("recurrence_interval")}
          onChange={(e) =>
            setValue(
              "recurrence_interval",
              e.target.value as CreateRecurringLoanFormData["recurrence_interval"],
              { shouldValidate: true },
            )
          }
          error={errors.recurrence_interval?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            name="start_date"
            icon={Calendar}
            type="date"
            {...register("start_date")}
            error={errors.start_date?.message}
          />
          <Input
            label="End Date (optional)"
            name="end_date"
            icon={Calendar}
            type="date"
            {...register("end_date")}
            error={errors.end_date?.message}
          />
        </div>

        <Input
          label="Max Occurrences (optional)"
          name="max_occurrences"
          icon={Hash}
          type="number"
          step="1"
          {...register("max_occurrences", { valueAsNumber: true })}
          error={errors.max_occurrences?.message}
        />
      </form>
    </Modal>
  );
}

export default CreateRecurringLoanDialog;
