import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { ToastType } from "./ToastProvider";

interface ToastMessageProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

const config: Record<
  ToastType,
  { border: string; icon: typeof CheckCircle; iconColor: string }
> = {
  success: { border: "border-[#DCFCE7]", icon: CheckCircle, iconColor: "text-green-600" },
  error: { border: "border-[#FEE2E2]", icon: XCircle, iconColor: "text-red-600" },
  warning: { border: "border-[#FFFBEB]", icon: AlertTriangle, iconColor: "text-amber-500" },
  info: { border: "border-[#E0E7FF]", icon: Info, iconColor: "text-blue-600" },
};

export function ToastMessage({ id, type, message, onClose }: ToastMessageProps) {
  const { border, icon: Icon, iconColor } = config[type];

  return (
    <div
      data-testid={`toast-${type}`}
      className={`flex items-center gap-3 w-[360px] bg-white border ${border} rounded-[12px] shadow-toast px-4 py-3.5`}
    >
      <Icon size={20} className={`shrink-0 ${iconColor}`} aria-hidden="true" />
      <p className="flex-1 text-sm font-body text-text-primary">{message}</p>
      <button
        type="button"
        aria-label="close"
        onClick={() => onClose(id)}
        className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
