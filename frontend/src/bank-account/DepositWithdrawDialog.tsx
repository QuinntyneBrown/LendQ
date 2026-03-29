import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, FileText } from "lucide-react";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";
import { formatCurrency } from "@/utils/format";
import { useToast } from "@/notifications/useToast";
import { depositSchema, withdrawSchema } from "./schemas";
import type { DepositFormData, WithdrawFormData } from "./schemas";
import { useDeposit, useWithdraw } from "./hooks";

interface DepositWithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "deposit" | "withdraw";
  accountId: string;
  currentBalance: number;
}

export function DepositWithdrawDialog({
  open,
  onClose,
  mode,
  accountId,
  currentBalance,
}: DepositWithdrawDialogProps) {
  const isDeposit = mode === "deposit";
  const schema = isDeposit ? depositSchema : withdrawSchema;
  const depositMutation = useDeposit();
  const withdrawMutation = useWithdraw();
  const mutation = isDeposit ? depositMutation : withdrawMutation;
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepositFormData | WithdrawFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined as unknown as number,
      reason_code: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: undefined as unknown as number,
        reason_code: "",
        description: "",
      });
    }
  }, [open, reset]);

  const watchedAmount = watch("amount");
  const previewBalance = isDeposit
    ? currentBalance + (Number(watchedAmount) || 0)
    : currentBalance - (Number(watchedAmount) || 0);

  const onSubmit = (data: DepositFormData | WithdrawFormData) => {
    mutation.mutate(
      {
        accountId,
        amount: String(data.amount),
        reason_code: data.reason_code,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            isDeposit
              ? `Successfully deposited ${formatCurrency(data.amount)}`
              : `Successfully withdrawn ${formatCurrency(data.amount)}`,
          );
          onClose();
        },
        onError: () => {
          toast.error(
            isDeposit ? "Failed to deposit funds" : "Failed to withdraw funds",
          );
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isDeposit ? "Deposit Funds" : "Withdraw Funds"}
      maxWidth="max-w-[480px]"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            {isDeposit ? "Confirm Deposit" : "Confirm Withdraw"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="bg-background rounded-button p-4">
          <p className="text-sm font-semibold text-text-secondary">Current Balance</p>
          <p className="text-lg font-bold text-text-primary mt-1">
            {formatCurrency(currentBalance)}
          </p>
        </div>

        <Input
          label="Amount"
          icon={DollarSign}
          type="number"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
        />

        <Input
          label="Reason Code"
          {...register("reason_code")}
          error={errors.reason_code?.message}
        />

        <Input
          label="Description (optional)"
          icon={FileText}
          {...register("description")}
          error={errors.description?.message}
        />

        <div data-testid="balance-preview" className={`rounded-button p-4 ${isDeposit ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"}`}>
          <p className="text-sm font-semibold text-text-secondary">
            Balance After {isDeposit ? "Deposit" : "Withdrawal"}
          </p>
          <p className="text-lg font-bold text-text-primary mt-1">
            {formatCurrency(Math.max(previewBalance, 0))}
          </p>
          {!isDeposit && (Number(watchedAmount) || 0) > currentBalance && (
            <p className="text-xs text-danger-text mt-1">
              Insufficient balance for this withdrawal.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default DepositWithdrawDialog;
