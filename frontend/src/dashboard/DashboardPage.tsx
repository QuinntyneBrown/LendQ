import { useAuth } from "@/auth/hooks";
import { SummaryCards } from "./SummaryCards";
import { ActiveLoansPanel } from "./ActiveLoansPanel";
import { ActivityFeed } from "./ActivityFeed";
import { useDashboardSummary, useDashboardActivity } from "./hooks";

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useDashboardSummary();
  const activity = useDashboardActivity();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold text-text-primary">Dashboard</h1>
        <p className="text-[15px] text-text-secondary mt-1">
          Welcome back, {user?.name}
        </p>
      </div>

      <SummaryCards
        data={summary.data}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => summary.refetch()}
      />

      <ActiveLoansPanel />

      <ActivityFeed
        items={activity.data}
        isLoading={activity.isLoading}
        isError={activity.isError}
        onRetry={() => activity.refetch()}
      />
    </div>
  );
}
