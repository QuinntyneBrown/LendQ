import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/ui/Modal";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { useCreateAdminAccount } from "@/admin/bank-accounts/hooks";
import { createAccountSchema } from "@/admin/bank-accounts/schemas";
import type { CreateAccountFormData } from "@/admin/bank-accounts/schemas";

interface Props {
  open: boolean;
  onClose: () => void;
  user: { user_id: string; user_name: string; user_email: string } | null;
}

export function CreateBankAccountDialog({ open, onClose, user }: Props) {
  const toast = useToast();
  const createAccount = useCreateAdminAccount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      user_id: "",
      currency: "USD",
      initial_deposit: 0,
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        user_id: user?.user_id ?? "",
        currency: "USD",
        initial_deposit: 0,
        note: "",
      });
    }
  }, [open, user, reset]);

  function onSubmit(data: CreateAccountFormData) {
    createAccount.mutate(
      {
        user_id: data.user_id,
        currency: data.currency,
        initial_deposit: data.initial_deposit,
        note: data.note || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Account created successfully");
          onClose();
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Failed to create account";
          toast.error(message);
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Bank Account"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createAccount.isPending}
            isLoading={createAccount.isPending}
          >
            Create Account
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="bg-background rounded-button p-4">
          <p
            data-testid="user-name"
            className="text-sm font-semibold text-text-primary"
          >
            {user?.user_name}
          </p>
          <p
            data-testid="user-email"
            className="text-xs text-text-secondary mt-1"
          >
            {user?.user_email}
          </p>
        </div>

        <input type="hidden" {...register("user_id")} />

        <Select
          label="Currency"
          name="currency"
          value="USD"
          disabled
          options={[{ value: "USD", label: "USD — US Dollar" }]}
        />

        <div>
          <Input
            label="Initial Deposit (Optional)"
            type="number"
            step="0.01"
            {...register("initial_deposit", { valueAsNumber: true })}
            error={errors.initial_deposit?.message}
          />
          <p className="text-xs text-text-muted mt-1">
            Leave at $0.00 for zero balance
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="textarea-note"
            className="text-text-secondary text-[13px] font-medium font-body"
          >
            Note (Optional)
          </label>
          <textarea
            id="textarea-note"
            placeholder="Reason for creating account..."
            {...register("note")}
            className="w-full rounded-input border border-border-strong px-4 py-3 font-body text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            rows={3}
          />
          {errors.note && (
            <p className="text-danger-text text-xs font-body">
              {errors.note.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default CreateBankAccountDialog;
