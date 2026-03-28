import {
  CheckCircle,
  Calendar,
  Pause,
  PlusCircle,
  Edit,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActivityItem } from "@/api/types";
import { relativeTime } from "@/utils/format";

const eventConfig: Record<string, { icon: LucideIcon; color: string }> = {
  payment_recorded: { icon: CheckCircle, color: "text-green-600 bg-green-100" },
  payment_rescheduled: { icon: Calendar, color: "text-blue-600 bg-blue-100" },
  payment_paused: { icon: Pause, color: "text-amber-600 bg-amber-100" },
  loan_created: { icon: PlusCircle, color: "text-purple-600 bg-purple-100" },
  loan_modified: { icon: Edit, color: "text-gray-600 bg-gray-100" },
};

const defaultConfig = { icon: Edit, color: "text-gray-600 bg-gray-100" };

interface ActivityFeedItemProps {
  item: ActivityItem;
}

export function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const config = eventConfig[item.event_type] ?? defaultConfig;
  const Icon = config.icon;
  const [textColor, bgColor] = config.color.split(" ");

  return (
    <div data-testid="activity-item" className="flex items-start gap-3 py-3">
      <div
        data-testid="activity-icon"
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}
      >
        <Icon size={16} className={textColor} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p data-testid="activity-description" className="text-sm text-text-primary">
          {item.description}
        </p>
        <p data-testid="activity-timestamp" className="text-xs text-text-secondary mt-0.5">
          {relativeTime(item.timestamp)}
        </p>
      </div>
    </div>
  );
}
