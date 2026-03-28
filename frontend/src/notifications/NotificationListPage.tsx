import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellOff } from "lucide-react";
import { useNotifications, useMarkAllRead, useMarkRead } from "./hooks";
import { NotificationDateGroup } from "./NotificationDateGroup";
import { Pagination, EmptyState } from "@/ui";
import type { Notification, NotificationType } from "@/api/types";
import { isToday, isYesterday } from "date-fns";

interface FilterTab {
  label: string;
  type?: NotificationType;
}

const filterTabs: FilterTab[] = [
  { label: "All" },
  { label: "Payments", type: "PAYMENT_DUE" },
  { label: "Overdue", type: "PAYMENT_OVERDUE" },
  { label: "Schedule Changes", type: "SCHEDULE_CHANGED" },
  { label: "System", type: "SYSTEM" },
];

function groupByDate(items: Notification[]): { label: string; notifications: Notification[] }[] {
  const groups: Record<string, Notification[]> = {};
  const order: string[] = [];

  for (const item of items) {
    const date = new Date(item.created_at);
    let label: string;
    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else {
      label = "Earlier";
    }

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(item);
  }

  return order.map((label) => ({ label, notifications: groups[label] }));
}

export function NotificationListPage() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const navigate = useNavigate();

  const selectedTab = filterTabs.find((t) => t.label === activeFilter);
  const { data, isLoading } = useNotifications(page, selectedTab?.type);
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const notifications = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  function handleItemClick(notification: Notification) {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.loan_id) {
      navigate(`/loans/${notification.loan_id}`);
    }
  }

  const dateGroups = groupByDate(notifications);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Notifications</h1>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          className="text-sm font-body text-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            data-testid="notification-filter-tab"
            onClick={() => {
              setActiveFilter(tab.label);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-button text-sm font-body font-medium transition-colors ${
              activeFilter === tab.label
                ? "bg-primary text-white"
                : "bg-background text-text-secondary hover:bg-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!isLoading && notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="bg-surface rounded-card border border-border overflow-hidden">
          {dateGroups.map((group) => (
            <NotificationDateGroup
              key={group.label}
              label={group.label}
              notifications={group.notifications}
              onItemClick={handleItemClick}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default NotificationListPage;
