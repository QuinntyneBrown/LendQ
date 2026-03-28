import { CheckCircle, Calendar, Pause } from "lucide-react";
import type { ChangeLog } from "@/api/types";
import { relativeTime } from "@/utils/format";

interface ChangeLogEntryProps {
  entry: ChangeLog;
}

function getIcon(entityType: string) {
  switch (entityType.toLowerCase()) {
    case "payment":
      return { Icon: CheckCircle, color: "text-success-text" };
    case "reschedule":
      return { Icon: Calendar, color: "text-info-text" };
    case "pause":
      return { Icon: Pause, color: "text-warning-text" };
    default:
      return { Icon: CheckCircle, color: "text-text-muted" };
  }
}

export function ChangeLogEntry({ entry }: ChangeLogEntryProps) {
  const { Icon, color } = getIcon(entry.entity_type);

  return (
    <div data-testid="history-entry" className="flex items-start gap-3 py-3">
      <div data-testid="entry-icon" className={`mt-0.5 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p data-testid="entry-description" className="text-sm text-text-primary">
          {entry.reason || `${entry.entity_type} — ${entry.field_name} updated`}
        </p>
        <p data-testid="entry-timestamp" className="text-xs text-text-muted mt-0.5">
          {relativeTime(entry.changed_at)}
        </p>
        {entry.old_value && entry.new_value && (
          <p data-testid="change-detail" className="text-xs text-text-muted mt-1">
            {entry.old_value} &rarr; {entry.new_value}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChangeLogEntry;
