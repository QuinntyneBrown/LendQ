import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Target, CheckCircle, Clock, Calendar, Edit, Plus } from "lucide-react";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { MetricCard } from "@/ui/MetricCard";
import { LoadingSkeleton } from "@/ui/LoadingSkeleton";
import { ErrorState } from "@/ui/ErrorState";
import { Pagination } from "@/ui/Pagination";
import { formatCurrency, formatDate } from "@/utils/format";
import { useSavingsGoal, useSavingsGoalEntries } from "./hooks";
import { CreateEditSavingsGoalDialog } from "./CreateEditSavingsGoalDialog";
import { AddFundsDialog } from "./AddFundsDialog";
import type { SavingsGoal } from "@/api/types";

function statusBadgeProps(goal: SavingsGoal): { label: string; variant: "active" | "overdue" | "paid_off" | "default" } {
  if (goal.status === "COMPLETED") {
    return { label: "Completed", variant: "active" };
  }
  if (goal.status === "CANCELLED") {
    return { label: "Cancelled", variant: "default" };
  }
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    if (deadlineDate < now && goal.progress_percent < 100) {
      return { label: "Overdue", variant: "overdue" };
    }
  }
  return { label: "In Progress", variant: "paid_off" };
}

function getDaysLeft(deadline: string | null): string {
  if (!deadline) return "No Deadline";
  const now = new Date();
  const target = new Date(deadline);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Past Due";
  if (diff === 0) return "Today";
  return String(diff);
}

export function SavingsGoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { data: goal, isLoading, isError, refetch } = useSavingsGoal(goalId!);
  const [entriesPage, setEntriesPage] = useState(1);
  const { data: entriesData, isLoading: entriesLoading } = useSavingsGoalEntries(goalId!, entriesPage);

  const [editOpen, setEditOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSkeleton count={3} className="h-12" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        name="savings-goal-detail"
        message="Failed to load savings goal."
        onRetry={() => refetch()}
      />
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-body text-text-secondary">Savings goal not found.</p>
      </div>
    );
  }

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const badge = statusBadgeProps(goal);
  const daysLeft = getDaysLeft(goal.deadline);
  const isActive = goal.status === "IN_PROGRESS";

  return (
    <div className="flex flex-col gap-6">
      {/* Back breadcrumb */}
      <button
        type="button"
        onClick={() => navigate("/savings")}
        className="flex items-center gap-1 text-text-muted text-[13px] font-medium w-fit hover:text-text-primary transition-colors"
      >
        <ChevronLeft size={18} />
        Savings Goals
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1
            data-testid="goal-name"
            className="font-heading text-[28px] font-bold text-text-primary"
          >
            {goal.name}
          </h1>
          <span data-testid="goal-status-badge" className="flex-shrink-0">
            <Badge label={badge.label} variant={badge.variant} />
          </span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
          {isActive && (
            <>
              <Button
                variant="secondary"
                icon={Edit}
                onClick={() => setEditOpen(true)}
              >
                Edit Goal
              </Button>
              <Button
                icon={Plus}
                onClick={() => setAddFundsOpen(true)}
              >
                Add Funds
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          testId="metric-target"
          icon={Target}
          label="Target Amount"
          value={goal.target_amount}
          format="currency"
        />
        <MetricCard
          testId="metric-saved"
          icon={CheckCircle}
          label="Saved So Far"
          value={goal.current_amount}
          format="currency"
        />
        <MetricCard
          testId="metric-remaining"
          icon={Clock}
          label="Remaining"
          value={remaining}
          format="currency"
        />
        <MetricCard
          testId="metric-days-left"
          icon={Calendar}
          label="Days Left"
          value={daysLeft}
        />
      </div>

      {/* Large progress bar */}
      <div className="bg-surface rounded-card border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm font-medium text-text-secondary">Progress</span>
          <span className="font-body text-sm font-bold text-primary">
            {Math.round(goal.progress_percent)}%
          </span>
        </div>
        <div data-testid="progress-bar" className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all"
            style={{ width: `${Math.min(goal.progress_percent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-body text-[13px] text-text-muted">
            {formatCurrency(goal.current_amount)}
          </span>
          <span className="font-body text-[13px] text-text-muted">
            {formatCurrency(goal.target_amount)}
          </span>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <Card className="p-5">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-2">Description</h2>
          <p className="font-body text-sm text-text-secondary">{goal.description}</p>
        </Card>
      )}

      {/* Contribution history */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Contributions
          </h2>
        </div>
        <div className="overflow-x-auto">
          {entriesLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={3} className="h-10" />
            </div>
          ) : !entriesData?.items?.length ? (
            <div className="py-12 text-center">
              <p className="font-body text-sm text-text-muted">No contributions yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left font-body text-[13px] font-medium text-text-muted">Date</th>
                  <th className="px-6 py-3 text-left font-body text-[13px] font-medium text-text-muted">Type</th>
                  <th className="px-6 py-3 text-right font-body text-[13px] font-medium text-text-muted">Amount</th>
                  <th className="px-6 py-3 text-right font-body text-[13px] font-medium text-text-muted">Running Total</th>
                </tr>
              </thead>
              <tbody>
                {entriesData.items.map((entry) => (
                  <tr
                    key={entry.id}
                    data-testid="contribution-row"
                    className="border-b border-border last:border-b-0 hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-3 font-body text-sm text-text-primary">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-6 py-3 font-body text-sm text-text-secondary capitalize">
                      {entry.entry_type.toLowerCase()}
                    </td>
                    <td className={`px-6 py-3 font-body text-sm text-right font-medium ${
                      entry.direction === "CREDIT" ? "text-green-600" : "text-danger-text"
                    }`}>
                      {entry.direction === "CREDIT" ? "+" : "-"}{formatCurrency(entry.amount)}
                    </td>
                    <td className="px-6 py-3 font-body text-sm text-right text-text-primary font-medium">
                      {formatCurrency(entry.running_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {entriesData && entriesData.pages > 1 && (
          <div className="flex justify-center py-4 border-t border-border">
            <Pagination
              page={entriesData.page}
              totalPages={entriesData.pages}
              onPageChange={setEntriesPage}
            />
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <CreateEditSavingsGoalDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        goal={goal}
      />

      {addFundsOpen && (
        <AddFundsDialog
          open={addFundsOpen}
          onClose={() => setAddFundsOpen(false)}
          goal={goal}
        />
      )}
    </div>
  );
}

export default SavingsGoalDetailPage;
