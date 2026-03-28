import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <Icon size={48} className="text-text-muted mb-4" aria-hidden="true" />
      <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-text-secondary font-body text-sm max-w-md mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}

export default EmptyState;
