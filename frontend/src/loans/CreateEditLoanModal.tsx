import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, DollarSign, Percent, Calendar } from "lucide-react";
import type { Loan } from "@/api/types";
import type { z } from "zod";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Textarea } from "@/ui/Textarea";
import { Button } from "@/ui/Button";
import { BorrowerSelect } from "./BorrowerSelect";
import { createLoanSchema } from "./schemas";
import { useCreateLoan, useUpdateLoan } from "./hooks";

type FormValues = z.input<typeof createLoanSchema>;

interface CreateEditLoanModalProps {
  open: boolean;
  onClose: () => void;
  loan?: Loan;
  onSuccess?: (loan?: Loan) => void;
}

const frequencyOptions = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CUSTOM", label: "Custom" },
];

export function CreateEditLoanModal({
  open,
  onClose,
  loan,
  onSuccess,
}: CreateEditLoanModalProps) {
  const isEdit = !!loan;
  const createMutation = useCreateLoan();
  const updateMutation = useUpdateLoan();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      borrower_id: "",
      description: "",
      principal: undefined as unknown as number,
      interest_rate: 0,
      repayment_frequency: "MONTHLY",
      num_payments: undefined,
      start_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (loan) {
        reset({
          borrower_id: loan.borrower_id,
          description: loan.description,
          principal: loan.principal,
          interest_rate: loan.interest_rate,
          repayment_frequency: loan.repayment_frequency,
          num_payments: undefined,
          start_date: loan.start_date,
          notes: loan.notes || "",
        });
      } else {
        reset({
          borrower_id: "",
          description: "",
          principal: undefined as unknown as number,
          interest_rate: 0,
          repayment_frequency: "MONTHLY",
          num_payments: undefined,
          start_date: "",
          notes: "",
        });
      }
    }
  }, [open, loan, reset]);

  const borrowerId = watch("borrower_id");

  const onSubmit = (data: FormValues) => {
    if (!isEdit && (!data.num_payments || Number.isNaN(data.num_payments))) {
      setError("num_payments", { message: "Installment count is required" });
      return;
    }

    if (isEdit) {
      const { borrower_id, num_payments, ...updateData } = data;
      void borrower_id;
      void num_payments;
      updateMutation.mutate(
        { id: loan.id, ...updateData } as Record<string, unknown> & { id: string },
        {
          onSuccess: (updatedLoan) => {
            onSuccess?.(updatedLoan);
            onClose();
          },
        },
      );
    } else {
      createMutation.mutate(data as unknown as Record<string, unknown>, {
        onSuccess: (createdLoan) => {
          onSuccess?.(createdLoan);
          onClose();
        },
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Loan" : "Create New Loan"}
      maxWidth="max-w-[560px]"
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
            {isEdit ? "Save" : "Create Loan"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <BorrowerSelect
          value={borrowerId}
          onChange={(userId) => {
            setValue("borrower_id", userId, { shouldValidate: true });
          }}
          error={errors.borrower_id?.message}
        />

        <Input
          label="Description"
          icon={FileText}
          {...register("description")}
          error={errors.description?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Principal Amount"
            icon={DollarSign}
            type="number"
            step="0.01"
            disabled={isEdit}
            {...register("principal", { valueAsNumber: true })}
            error={errors.principal?.message}
          />
          <Input
            label="Interest Rate (optional)"
            icon={Percent}
            type="number"
            step="0.01"
            disabled={isEdit}
            {...register("interest_rate", { valueAsNumber: true })}
            error={errors.interest_rate?.message}
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
                e.target.value as FormValues["repayment_frequency"],
                { shouldValidate: true },
              )
            }
            error={errors.repayment_frequency?.message}
          />
          {!isEdit && (
            <Input
              label="Installment Count"
              type="number"
              step="1"
              {...register("num_payments", { valueAsNumber: true })}
              error={errors.num_payments?.message}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            icon={Calendar}
            type="date"
            {...register("start_date")}
            error={errors.start_date?.message}
          />
        </div>

        <Textarea
          label="Notes (optional)"
          name="notes"
          value={watch("notes") ?? ""}
          onChange={(e) => setValue("notes", e.target.value)}
          error={errors.notes?.message}
        />
      </form>
    </Modal>
  );
}

export default CreateEditLoanModal;
