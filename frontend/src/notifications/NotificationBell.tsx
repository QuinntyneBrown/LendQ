import { useState, useRef } from "react";
import { Bell } from "lucide-react";
import { useUnreadCount } from "./hooks";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        type="button"
        data-testid="notification-bell"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold font-body px-1"
          >
            {count}
          </span>
        )}
      </button>
      <NotificationDropdown open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
