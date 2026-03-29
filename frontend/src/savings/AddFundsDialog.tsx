import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SavingsGoal } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";
import { formatCurrency } from "@/utils/format";
import { contributeSchema } from "./schemas";
import type { ContributeFormData } from "./schemas";
import { useContribute } from "./hooks";

interface AddFundsDialogProps {
  open: boolean;
  onClose: () => void;
  goal: SavingsGoal;
  onSuccess?: () => void;
}

function generateIdempotencyKey(): string {
  return `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function AddFundsDialog({
  open,
  onClose,
  goal,
  onSuccess,
}: AddFundsDialogProps) {
  const contributeMutation = useContribute();
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContributeFormData>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      account_id: "",
    },
  });

  const watchedAmount = watch("amount");

  const progressPreview = useMemo(() => {
    const amt = Number(watchedAmount) || 0;
    const newTotal = goal.current_amount + amt;
    const newPercent = Math.min((newTotal / goal.target_amount) * 100, 100);
    return { newTotal, newPercent };
  }, [watchedAmount, goal.current_amount, goal.target_amount]);

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  const onSubmit = (data: ContributeFormData) => {
    contributeMutation.mutate(
      {
        goalId: goal.id,
        amount: data.amount,
        account_id: data.account_id,
        idempotency_key: idempotencyKey,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Funds"
      maxWidth="max-w-[480px]"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            isLoading={contributeMutation.isPending}
            disabled={contributeMutation.isPending}
          >
            Add Funds
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Current balance info */}
        <div className="bg-background rounded-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-[13px] text-text-muted">Current Savings</span>
            <span className="font-body text-sm font-bold text-text-primary">
              {formatCurrency(goal.current_amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-[13px] text-text-muted">Remaining to Goal</span>
            <span data-testid="available-balance" className="font-body text-sm font-bold text-text-primary">
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        {/* Amount input */}
        <Input
          label="Amount to Add"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
        />

        {/* Account ID input */}
        <Input
          label="Source Account ID"
          placeholder="Enter account ID"
          {...register("account_id")}
          error={errors.account_id?.message}
        />

        {/* Progress preview */}
        {watchedAmount > 0 && (
          <div data-testid="progress-preview" className="bg-background rounded-card p-4 flex flex-col gap-2">
            <span className="font-body text-[13px] font-medium text-text-secondary">
              After this contribution
            </span>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-text-primary">
                {formatCurrency(progressPreview.newTotal)} / {formatCurrency(goal.target_amount)}
              </span>
              <span className="font-body text-sm font-bold text-primary">
                {Math.round(progressPreview.newPercent)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progressPreview.newPercent}%` }}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default AddFundsDialog;
