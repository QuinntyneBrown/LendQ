import { useState } from "react";
import { AlertTriangle, Play, XCircle } from "lucide-react";
import type { RecurringLoan } from "@/api/types";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Textarea } from "@/ui/Textarea";
import { formatDate } from "@/utils/format";
import {
  usePauseRecurringLoan,
  useResumeRecurringLoan,
  useCancelRecurringLoan,
} from "./hooks";

interface PauseResumeCancelDialogProps {
  open: boolean;
  onClose: () => void;
  action: "pause" | "resume" | "cancel";
  recurringLoan: RecurringLoan;
  onSuccess?: () => void;
}

const actionConfig = {
  pause: {
    title: "Pause Recurring Loan",
    description:
      "Pausing will stop automatic loan generation. You can resume at any time.",
    confirmLabel: "Pause",
    variant: "secondary" as const,
    icon: AlertTriangle,
    bannerClass: "bg-warning/10 border-warning text-warning-text",
  },
  resume: {
    title: "Resume Recurring Loan",
    description: "Resuming will restart automatic loan generation.",
    confirmLabel: "Resume",
    variant: "primary" as const,
    icon: Play,
    bannerClass: "bg-success/10 border-success text-success-text",
  },
  cancel: {
    title: "Cancel Recurring Loan",
    description:
      "This action cannot be undone. All future loan generation will be permanently stopped.",
    confirmLabel: "Cancel Recurring Loan",
    variant: "destructive" as const,
    icon: XCircle,
    bannerClass: "bg-danger/10 border-danger text-danger-text",
  },
};

export function PauseResumeCancelDialog({
  open,
  onClose,
  action,
  recurringLoan,
  onSuccess,
}: PauseResumeCancelDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const pauseMutation = usePauseRecurringLoan();
  const resumeMutation = useResumeRecurringLoan();
  const cancelMutation = useCancelRecurringLoan();

  const config = actionConfig[action];
  const isPending =
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    cancelMutation.isPending;

  const canConfirmCancel = action !== "cancel" || confirmText === "CANCEL";

  const handleConfirm = () => {
    const id = recurringLoan.id;

    if (action === "pause") {
      pauseMutation.mutate(
        { id, reason: reason || undefined },
        { onSuccess: () => onSuccess?.() },
      );
    } else if (action === "resume") {
      resumeMutation.mutate(id, {
        onSuccess: () => onSuccess?.(),
      });
    } else {
      cancelMutation.mutate(
        { id, reason: reason || undefined },
        { onSuccess: () => onSuccess?.() },
      );
    }
  };

  const BannerIcon = config.icon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Go Back
          </Button>
          <Button
            variant={config.variant}
            onClick={handleConfirm}
            isLoading={isPending}
            disabled={isPending || !canConfirmCancel}
          >
            {config.confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Warning Banner */}
        <div
          className={`flex items-start gap-3 p-4 rounded-card border ${config.bannerClass}`}
        >
          <BannerIcon size={20} className="flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm">{config.description}</p>
        </div>

        {/* Action-specific content */}
        {action === "resume" && recurringLoan.next_generation_at && (
          <div className="bg-background rounded-card p-4">
            <p className="font-body text-sm text-text-secondary">
              Next loan will be generated on{" "}
              <span className="font-semibold text-text-primary">
                {formatDate(recurringLoan.next_generation_at)}
              </span>
            </p>
          </div>
        )}

        {/* Reason field for pause/cancel */}
        {(action === "pause" || action === "cancel") && (
          <Textarea
            label={action === "pause" ? "Reason (optional)" : "Reason (optional)"}
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Why are you ${action === "pause" ? "pausing" : "cancelling"} this recurring loan?`}
            rows={3}
          />
        )}

        {/* Cancel confirmation */}
        {action === "cancel" && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cancel-confirm"
              className="text-text-secondary text-[13px] font-medium font-body"
            >
              Type <span className="font-bold">CANCEL</span> to confirm
            </label>
            <input
              id="cancel-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-input border border-border-strong px-4 py-3 font-body text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="CANCEL"
            />
          </div>
        )}

        {/* Summary info */}
        <div className="bg-background rounded-card p-4">
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between">
              <dt className="font-body text-[13px] text-text-muted">Borrower</dt>
              <dd className="font-body text-sm font-medium text-text-primary">
                {recurringLoan.borrower_name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-body text-[13px] text-text-muted">Total Generated</dt>
              <dd className="font-body text-sm font-medium text-text-primary">
                {recurringLoan.total_generated}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-body text-[13px] text-text-muted">Status</dt>
              <dd className="font-body text-sm font-medium text-text-primary">
                {recurringLoan.status}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Modal>
  );
}

export default PauseResumeCancelDialog;
