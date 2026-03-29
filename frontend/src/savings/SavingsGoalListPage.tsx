import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, PiggyBank } from "lucide-react";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { ErrorState } from "@/ui/ErrorState";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { Pagination } from "@/ui/Pagination";
import { Badge } from "@/ui/Badge";
import { formatCurrency } from "@/utils/format";
import { useSavingsGoals } from "./hooks";
import { CreateEditSavingsGoalDialog } from "./CreateEditSavingsGoalDialog";
import type { SavingsGoal, SavingsGoalStatus } from "@/api/types";

function statusBadgeProps(goal: SavingsGoal): { label: string; variant: "active" | "overdue" | "paid_off" | "default" } {
  if (goal.status === "COMPLETED") {
    return { label: "Completed", variant: "active" };
  }
  if (goal.status === "CANCELLED") {
    return { label: "Cancelled", variant: "default" };
  }
  // IN_PROGRESS - check if overdue
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    if (deadlineDate < now && goal.progress_percent < 100) {
      return { label: "Overdue", variant: "overdue" };
    }
  }
  return { label: "In Progress", variant: "paid_off" };
}

function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SavingsGoalListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useSavingsGoals(page);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[28px] font-bold text-text-primary">
          Savings Goals
        </h1>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Create New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <LoadingSkeleton count={6} className="h-48" />
        </div>
      ) : isError ? (
        <ErrorState
          name="savings-goals"
          message="Failed to load savings goals."
          onRetry={() => refetch()}
        />
      ) : !data?.items?.length ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create your first savings goal to start tracking your progress."
          action={
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Create New Goal
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((goal) => {
              const badge = statusBadgeProps(goal);
              return (
                <button
                  key={goal.id}
                  type="button"
                  data-testid="savings-goal-card"
                  onClick={() => navigate(`/savings/${goal.id}`)}
                  className="bg-surface rounded-card border border-border p-5 flex flex-col gap-3 text-left hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-body text-[16px] font-bold text-text-primary truncate">
                      {goal.name}
                    </span>
                    <span data-testid="status-badge" className="flex-shrink-0">
                      <Badge label={badge.label} variant={badge.variant} />
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(goal.progress_percent, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-text-primary font-medium">
                      {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </span>
                    <span className="font-body text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-badge">
                      {Math.round(goal.progress_percent)}%
                    </span>
                  </div>

                  {goal.deadline && (
                    <span className="font-body text-[13px] text-text-muted">
                      Deadline: {formatDeadline(goal.deadline)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Pagination
              page={data.page}
              totalPages={data.pages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <CreateEditSavingsGoalDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

export default SavingsGoalListPage;
