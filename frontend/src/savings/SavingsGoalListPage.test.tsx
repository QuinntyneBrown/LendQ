import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SavingsGoalListPage } from "./SavingsGoalListPage";
import { renderWithRouter } from "@/test/render";

const savingsState = vi.hoisted(() => ({
  data: {
    items: [
      {
        id: "goal-1",
        user_id: "u1",
        name: "Emergency Fund",
        target_amount: 1000,
        current_amount: 0,
        progress_percent: 0,
        deadline: "2026-12-31",
        description: null,
        status: "IN_PROGRESS" as const,
        currency: "CAD",
        version: 1,
        created_at: "2026-04-17T00:00:00",
        updated_at: "2026-04-17T00:00:00",
      },
    ],
    total: 1,
    page: 1,
    pages: 1,
    per_page: 20,
  },
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useSavingsGoals: () => savingsState,
  useCreateSavingsGoal: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useUpdateSavingsGoal: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useCancelSavingsGoal: () => ({ mutate: vi.fn(), isPending: false }),
  useAddFunds: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useReleaseFunds: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useSavingsGoalEntries: () => ({ data: { items: [], total: 0, page: 1, pages: 0 }, isLoading: false }),
}));

vi.mock("@/notifications/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

describe("SavingsGoalListPage", () => {
  it("renders the goal's deadline on the exact calendar day the API returned (bug 2026-04-17-savings-deadline-timezone-off-by-one)", () => {
    renderWithRouter(<SavingsGoalListPage />);

    // API returned `deadline: "2026-12-31"`. The card must display that exact
    // day, not the day before (the old implementation showed "Dec 30, 2026"
    // for users west of UTC because `new Date("2026-12-31")` parses as UTC
    // midnight and then renders in local time).
    expect(
      screen.getByText(/Deadline:\s*Dec\s*31,\s*2026/i),
    ).toBeInTheDocument();
  });
});
