import { DollarSign, AlertTriangle, Calendar, Edit, Info } from "lucide-react";
import type { Notification, NotificationType } from "@/api/types";
import { relativeTime } from "@/utils/format";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const iconConfig: Record<NotificationType, { icon: typeof DollarSign; color: string }> = {
  PAYMENT_DUE: { icon: DollarSign, color: "text-green-600" },
  PAYMENT_RECEIVED: { icon: DollarSign, color: "text-green-600" },
  PAYMENT_OVERDUE: { icon: AlertTriangle, color: "text-red-600" },
  SCHEDULE_CHANGED: { icon: Calendar, color: "text-amber-500" },
  LOAN_MODIFIED: { icon: Edit, color: "text-gray-500" },
  SYSTEM: { icon: Info, color: "text-blue-600" },
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { icon: Icon, color } = iconConfig[notification.type];

  return (
    <button
      type="button"
      data-testid="notification-item"
      data-unread={String(!notification.is_read)}
      onClick={() => onClick(notification)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-background ${
        notification.is_read ? "bg-surface" : "bg-[#FFF8F7]"
      }`}
    >
      <span data-testid="notification-icon" className={`mt-0.5 shrink-0 ${color}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p data-testid="notification-message" className="text-sm font-body text-text-primary">
          {notification.message}
        </p>
        <p data-testid="notification-timestamp" className="text-xs font-body text-text-muted mt-0.5">
          {relativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
      )}
    </button>
  );
}
