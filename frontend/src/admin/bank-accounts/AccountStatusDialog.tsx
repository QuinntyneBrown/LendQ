import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { useToast } from "@/notifications/useToast";
import { formatCurrency } from "@/utils/format";
import { useChangeAccountStatus } from "@/admin/bank-accounts/hooks";
import { changeStatusSchema } from "@/admin/bank-accounts/schemas";
import type { ChangeStatusFormData } from "@/admin/bank-accounts/schemas";
import type { BankAccountStatus } from "@/api/types";

type Action = "freeze" | "reactivate" | "close";

interface Props {
  open: boolean;
  onClose: () => void;
  account: {
    id: string;
    status: BankAccountStatus;
    user_name: string;
    user_email: string;
    current_balance: number;
  } | null;
}

function getDefaultAction(status: BankAccountStatus): Action {
  if (status === "ACTIVE") return "freeze";
  return "reactivate";
}

function getAvailableActions(status: BankAccountStatus): Action[] {
  if (status === "ACTIVE") return ["freeze", "close"];
  if (status === "FROZEN") return ["reactivate", "close"];
  return ["reactivate"];
}

function getTargetStatus(action: Action): BankAccountStatus {
  if (action === "freeze") return "FROZEN";
  if (action === "reactivate") return "ACTIVE";
  return "CLOSED";
}

function getTitle(action: Action): string {
  if (action === "freeze") return "Freeze Account";
  if (action === "reactivate") return "Reactivate Account";
  return "Close Account";
}

function getConfirmLabel(action: Action): string {
  if (action === "freeze") return "Freeze Account";
  if (action === "reactivate") return "Reactivate Account";
  return "Close Account";
}

function getConfirmVariant(action: Action): "primary" | "destructive" {
  if (action === "close") return "destructive";
  return "primary";
}

function getConfirmClassName(action: Action): string {
  if (action === "freeze") return "bg-amber-500 hover:bg-amber-600 text-white";
  if (action === "reactivate") return "bg-green-600 hover:bg-green-700 text-white";
  return "";
}

function getSubtitleVerb(action: Action): string {
  if (action === "freeze") return "freeze";
  if (action === "reactivate") return "reactivate";
  return "close";
}

function getImpactItems(action: Action): string[] {
  if (action === "freeze") {
    return [
      "Block all deposits and withdrawals",
      "Pause all recurring deposits",
      "Prevent the user from accessing their balance",
    ];
  }
  if (action === "reactivate") {
    return [
      "Restore access to deposits and withdrawals",
      "Allow recurring deposits to resume",
      "Enable the user to access their balance",
    ];
  }
  return [
    "Permanently close the account",
    "Block all future transactions",
    "Cancel all recurring deposits",
  ];
}

function getImpactColor(action: Action): string {
  if (action === "freeze") return "bg-amber-50 border border-amber-200";
  if (action === "reactivate") return "bg-green-50 border border-green-200";
  return "bg-red-50 border border-red-200";
}

function getSuccessVerb(action: Action): string {
  if (action === "freeze") return "frozen";
  if (action === "reactivate") return "reactivated";
  return "closed";
}

export function AccountStatusDialog({ open, onClose, account }: Props) {
  const toast = useToast();
  const changeStatus = useChangeAccountStatus();

  const [action, setAction] = useState<Action>("freeze");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangeStatusFormData>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: {
      status: "FROZEN",
      reason: "",
    },
  });

  const reason = watch("reason");

  useEffect(() => {
    if (open && account) {
      const defaultAction = getDefaultAction(account.status);
      setAction(defaultAction);
      reset({
        status: getTargetStatus(defaultAction),
        reason: "",
      });
    }
  }, [open, account, reset]);

  const availableActions = account ? getAvailableActions(account.status) : [];

  function handleActionChange(newAction: Action) {
    setAction(newAction);
    reset({
      status: getTargetStatus(newAction),
      reason: "",
    });
  }

  function onSubmit(data: ChangeStatusFormData) {
    if (!account) return;

    changeStatus.mutate(
      {
        accountId: account.id,
        status: data.status,
        reason: data.reason,
      },
      {
        onSuccess: () => {
          toast.success(`Account ${getSuccessVerb(action)} successfully`);
          onClose();
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Failed to update account status";
          toast.error(message);
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getTitle(action)}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            data-testid="status-confirm-button"
            variant={getConfirmVariant(action)}
            className={getConfirmClassName(action)}
            onClick={handleSubmit(onSubmit)}
            disabled={!reason || changeStatus.isPending}
            isLoading={changeStatus.isPending}
          >
            {getConfirmLabel(action)}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center text-center">
          <div
            data-testid="warning-icon"
            className="flex items-center justify-center rounded-full mb-4"
            style={{ width: 56, height: 56, backgroundColor: "#FEF3C7" }}
          >
            <TriangleAlert size={24} className="text-amber-600" aria-hidden="true" />
          </div>

          <p
            data-testid="status-subtitle"
            className="font-body text-sm text-text-secondary"
          >
            You are about to {getSubtitleVerb(action)} the bank account for:
          </p>
        </div>

        <div className="bg-background rounded-button p-4 text-center">
          <p
            data-testid="status-user-name"
            className="text-sm font-semibold text-text-primary"
          >
            {account?.user_name}
          </p>
          <p
            data-testid="status-user-balance"
            className="text-lg font-bold text-text-primary mt-1"
          >
            {formatCurrency(account?.current_balance ?? 0)}
          </p>
        </div>

        {availableActions.length > 1 && (
          <div className="flex gap-2">
            {availableActions.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => handleActionChange(a)}
                className={`flex-1 rounded-button px-3 py-2 text-sm font-semibold font-body transition-colors ${
                  a === action
                    ? "bg-primary text-white"
                    : "bg-background text-text-secondary border border-border-strong"
                }`}
              >
                {a === "freeze" ? "Freeze" : a === "reactivate" ? "Reactivate" : "Close"}
              </button>
            ))}
          </div>
        )}

        <div
          data-testid="impact-warning"
          className={`rounded-button p-4 ${getImpactColor(action)}`}
        >
          <p className="text-sm font-semibold text-text-primary mb-2">
            This action will:
          </p>
          <ul className="flex flex-col gap-1">
            {getImpactItems(action).map((item) => (
              <li
                key={item}
                data-testid="impact-item"
                className="text-sm text-text-secondary flex items-start gap-2"
              >
                <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="textarea-reason"
            className="text-text-secondary text-[13px] font-medium font-body"
          >
            Reason for status change
          </label>
          <textarea
            id="textarea-reason"
            required
            placeholder="Enter reason..."
            {...register("reason")}
            className={`w-full rounded-input border border-border-strong px-4 py-3 font-body text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none ${
              errors.reason ? "border-danger-text" : ""
            }`}
            rows={3}
          />
          {errors.reason && (
            <p className="text-danger-text text-xs font-body">
              {errors.reason.message}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default AccountStatusDialog;
