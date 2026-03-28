import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { TabletSidebar } from "./TabletSidebar";
import { renderWithRouter } from "@/test/render";

const authState = vi.hoisted(() => ({
  login: vi.fn<(...args: [string, string]) => Promise<void>>(),
  signup: vi.fn<(...args: [{ name: string; email: string; password: string; confirm_password: string }]) => Promise<void>>(),
  logout: vi.fn(),
  refreshToken: vi.fn<() => Promise<void>>(),
  user: { id: "u1", name: "Quinn Brown", email: "q@example.com", roles: [] },
  roles: ["Creditor"] as string[],
  isAuthenticated: true,
  isLoading: false,
}));

vi.mock("@/auth/hooks", () => ({
  useAuth: () => authState,
}));

describe("Navigation shell components", () => {
  beforeEach(() => {
    authState.logout.mockReset();
    authState.roles = ["Creditor"];
  });

  it("desktop sidebar hides admin-only nav for non-admins and shows it for admins", () => {
    renderWithRouter(<DesktopSidebar />, { route: "/dashboard", path: "*" });
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();

    cleanup();
    authState.roles = ["Admin"];
    renderWithRouter(<DesktopSidebar />, { route: "/dashboard", path: "*" });
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });

  it("mobile bottom nav exposes overflow actions and admin-only users link", async () => {
    const user = userEvent.setup();
    authState.roles = ["Admin"];
    renderWithRouter(<MobileBottomNav />, { route: "/dashboard", path: "*" });

    await user.click(screen.getByRole("button", { name: "More" }));

    expect(screen.getByTestId("more-menu")).toBeVisible();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });

  it("tablet sidebar renders backdrop and closes through the provided callback", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(<TabletSidebar open onClose={onClose} />, { route: "/dashboard", path: "*" });

    await user.click(screen.getByTestId("sidebar-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("sidebar-overlay")).toBeVisible();
  });

  it("mobile header shows hamburger trigger and avatar initial", async () => {
    const user = userEvent.setup();
    const onHamburgerClick = vi.fn();
    renderWithRouter(
      <MobileHeader showHamburger onHamburgerClick={onHamburgerClick} />,
      { route: "/dashboard", path: "*" },
    );

    await user.click(screen.getByTestId("hamburger-menu"));

    expect(onHamburgerClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("user-avatar")).toHaveTextContent("Q");
  });
});
