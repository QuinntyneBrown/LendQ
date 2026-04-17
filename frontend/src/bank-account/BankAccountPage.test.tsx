import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BankAccountPage from "./BankAccountPage";
import { renderWithRouter } from "@/test/render";

const authState = vi.hoisted(() => ({
  user: { id: "u1", name: "Bob Borrower", email: "borrower1@lendq.local" },
  roles: ["Borrower"],
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
}));

const accountsState = vi.hoisted(() => ({
  data: null as unknown,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

const transactionsState = vi.hoisted(() => ({
  data: { items: [], total: 0, page: 1, pages: 0, per_page: 20 },
  isLoading: false,
}));

const recurringState = vi.hoisted(() => ({
  data: { items: [] },
  isLoading: false,
}));

const toastState = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

const breakpointState = vi.hoisted(() => ({ isMobile: false }));

vi.mock("@/auth/hooks", () => ({
  useAuth: () => authState,
}));

vi.mock("@/layout/useBreakpoint", () => ({
  useBreakpoint: () => breakpointState,
}));

vi.mock("./hooks", () => ({
  useMyAccount: () => accountsState,
  useTransactions: () => transactionsState,
  useRecurringDeposits: () => recurringState,
  usePauseRecurringDeposit: () => ({ mutate: vi.fn() }),
  useResumeRecurringDeposit: () => ({ mutate: vi.fn() }),
  useCancelRecurringDeposit: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/notifications/useToast", () => ({
  useToast: () => toastState,
}));

describe("BankAccountPage", () => {
  it("renders a useful empty state when the user has no bank account (bug 2026-04-17-bank-account-empty-state-unhelpful)", () => {
    accountsState.data = null;

    renderWithRouter(<BankAccountPage />);

    // Heading identifies the situation.
    expect(
      screen.getByRole("heading", { name: /no bank account/i }),
    ).toBeInTheDocument();

    // Body text follows the user-guide phrasing, telling the user to talk to
    // an administrator so they know what to do next.
    expect(
      screen.getByText(/request an account from your administrator/i),
    ).toBeInTheDocument();
  });
});
