import { Link } from "react-router-dom";
import type { ActivityItem } from "@/api/types";
import { Card } from "@/ui/Card";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { ActivityFeedItem } from "./ActivityFeedItem";

interface ActivityFeedProps {
  items: ActivityItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ActivityFeed({ items, isLoading, isError, onRetry }: ActivityFeedProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold text-text-primary">
          Recent Activity
        </h2>
        <Link
          to="/notifications"
          role="link"
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          View All
        </Link>
      </div>

      {isLoading && <LoadingSkeleton className="h-16" count={3} />}

      {isError && (
        <ErrorState name="activity" message="Failed to load activity." onRetry={onRetry} />
      )}

      {!isLoading && !isError && items && (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <ActivityFeedItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
}
