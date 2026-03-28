import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";
import { renderWithRouter } from "@/test/render";

const authState = vi.hoisted(() => ({
  login: vi.fn<(...args: [string, string]) => Promise<void>>(),
  signup: vi.fn<(...args: [{ name: string; email: string; password: string; confirm_password: string }]) => Promise<void>>(),
  logout: vi.fn(),
  refreshToken: vi.fn<() => Promise<void>>(),
  user: null,
  roles: [] as string[],
  isAuthenticated: false,
  isLoading: false,
}));

const toastState = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useAuth: () => authState,
}));

vi.mock("@/notifications/useToast", () => ({
  useToast: () => toastState,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    authState.login.mockReset();
    authState.isAuthenticated = false;
    toastState.error.mockReset();
  });

  it("renders the auth links and left panel shell", () => {
    renderWithRouter(<LoginPage />, { route: "/login", path: "/login" });

    expect(screen.getByTestId("login-left-panel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot Password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByRole("link", { name: "Sign Up" })).toHaveAttribute("href", "/signup");
  });

  it("shows inline validation when submitted with empty credentials", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />, { route: "/login", path: "/login" });

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByTestId("error-email")).toBeVisible();
    expect(await screen.findByTestId("error-password")).toBeVisible();
  });

  it("disables inputs and submit while login is pending", async () => {
    const user = userEvent.setup();
    let resolveLogin!: () => void;
    authState.login.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        }),
    );

    renderWithRouter(<LoginPage />, { route: "/login", path: "/login" });

    await user.type(screen.getByLabelText("Email Address"), "creditor@family.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByLabelText("Email Address")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDisabled();

    resolveLogin();
  });
});
