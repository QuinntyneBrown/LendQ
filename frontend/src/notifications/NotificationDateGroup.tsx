import type { Notification } from "@/api/types";
import { NotificationItem } from "./NotificationItem";

interface NotificationDateGroupProps {
  label: string;
  notifications: Notification[];
  onItemClick: (notification: Notification) => void;
}

export function NotificationDateGroup({ label, notifications, onItemClick }: NotificationDateGroupProps) {
  return (
    <div data-testid="date-group">
      <h3 className="px-4 py-2 text-xs font-heading font-bold text-text-muted uppercase tracking-wider bg-background">
        {label}
      </h3>
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onClick={onItemClick} />
      ))}
    </div>
  );
}
