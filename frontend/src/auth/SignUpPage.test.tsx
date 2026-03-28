import { AxiosError } from "axios";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignUpPage from "./SignUpPage";
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

vi.mock("./hooks", () => ({
  useAuth: () => authState,
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    authState.signup.mockReset();
    authState.isAuthenticated = false;
  });

  it("shows field validation for mismatched passwords", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignUpPage />, { route: "/signup", path: "/signup" });

    await user.type(screen.getByLabelText("Full Name"), "Test User");
    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByTestId("error-confirm_password")).toBeVisible();
  });

  it("shows success state after a successful signup", async () => {
    const user = userEvent.setup();
    authState.signup.mockResolvedValue();
    renderWithRouter(<SignUpPage />, { route: "/signup", path: "/signup" });

    await user.type(screen.getByLabelText("Full Name"), "Test User");
    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByTestId("signup-success")).toBeVisible();
  });

  it("maps duplicate-email API failures to the email field", async () => {
    const user = userEvent.setup();
    authState.signup.mockRejectedValue(
      new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: { headers: {} as never },
        data: {},
      }),
    );
    renderWithRouter(<SignUpPage />, { route: "/signup", path: "/signup" });

    await user.type(screen.getByLabelText("Full Name"), "Test User");
    await user.type(screen.getByLabelText("Email Address"), "duplicate@example.com");
    await user.type(screen.getByLabelText(/^Password$/), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByTestId("error-email")).toHaveTextContent(
      "An account with this email already exists",
    );
  });
});
