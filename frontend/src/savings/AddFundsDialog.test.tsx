import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddFundsDialog } from "./AddFundsDialog";
import type { SavingsGoal } from "@/api/types";

const contributeState = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const accountState = vi.hoisted(() => ({
  data: { items: [] as Array<{ id: string }> },
}));

const toastState = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useContribute: () => contributeState,
}));

vi.mock("@/bank-account/hooks", () => ({
  useMyAccount: () => accountState,
}));

vi.mock("@/notifications/useToast", () => ({
  useToast: () => toastState,
}));

function makeGoal(): SavingsGoal {
  return {
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
  } as unknown as SavingsGoal;
}

describe("AddFundsDialog", () => {
  it("shows a helpful message when the user has no bank account (bug 2026-04-17-add-funds-silently-disabled-without-account)", () => {
    accountState.data = { items: [] };

    render(<AddFundsDialog open onClose={() => {}} goal={makeGoal()} />);

    // Tell the user why they can't submit and what to do about it.
    expect(
      screen.getByText(/need a bank account to fund a savings goal/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/request an account from your administrator/i)).toBeInTheDocument();

    // Amount input should be absent or hidden — there's nothing useful the
    // user can do with it.
    expect(screen.queryByLabelText(/amount to add/i)).not.toBeInTheDocument();
  });

  it("shows the amount input and progress preview when the user has an account", () => {
    accountState.data = { items: [{ id: "acct-1" }] };

    render(<AddFundsDialog open onClose={() => {}} goal={makeGoal()} />);

    expect(screen.getByLabelText(/amount to add/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/need a bank account to fund/i),
    ).not.toBeInTheDocument();
  });
});
