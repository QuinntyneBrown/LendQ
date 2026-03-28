import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useMarkAllRead, useUnreadCount } from "./hooks";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/api/types";

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data } = useNotifications(1);
  const { data: countData } = useUnreadCount();
  const markAllRead = useMarkAllRead();
  const unreadCount = countData?.count ?? 0;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const notifications = data?.items ?? [];

  function handleItemClick(notification: Notification) {
    if (notification.loan_id) {
      navigate(`/loans/${notification.loan_id}`);
    }
    onClose();
  }

  return (
    <div
      ref={dropdownRef}
      data-testid="notification-dropdown"
      className="absolute right-0 top-full mt-2 w-[380px] bg-surface rounded-card shadow-modal z-50"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading font-bold text-text-primary">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-primary text-white text-[10px] font-bold font-body px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="text-xs font-body text-[#FF6B6B] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="border-t border-border" />

      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted font-body">
            No notifications
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleItemClick} />
          ))
        )}
      </div>

      <div className="border-t border-border" />

      <button
        type="button"
        onClick={() => {
          navigate("/notifications");
          onClose();
        }}
        className="w-full px-4 py-3 text-center text-sm font-body text-primary hover:bg-background transition-colors rounded-b-card"
      >
        View all notifications
      </button>
    </div>
  );
}
