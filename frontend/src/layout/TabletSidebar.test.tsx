import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TabletSidebar } from "./TabletSidebar";
import { renderWithRouter } from "@/test/render";

const authState = vi.hoisted(() => ({
  user: { id: "u1", name: "Admin User", email: "admin@lendq.local" },
  roles: ["Admin"],
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("@/auth/hooks", () => ({
  useAuth: () => authState,
}));

describe("TabletSidebar", () => {
  it("shows Bank Accounts entry for admins (bug 2026-04-17-tablet-sidebar-missing-admin-bank-accounts)", () => {
    authState.roles = ["Admin"];

    renderWithRouter(<TabletSidebar open onClose={() => {}} />);

    expect(screen.getByRole("link", { name: /Bank Accounts/i })).toBeInTheDocument();
  });

  it("does NOT show Bank Accounts for non-admins", () => {
    authState.roles = ["Creditor"];

    renderWithRouter(<TabletSidebar open onClose={() => {}} />);

    expect(screen.queryByRole("link", { name: /Bank Accounts/i })).not.toBeInTheDocument();
  });
});
