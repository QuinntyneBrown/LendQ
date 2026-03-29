import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "./ForgotPasswordPage";
import ResetPasswordPage from "./ResetPasswordPage";
import { renderWithRouter } from "@/test/render";

const apiPostMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/client", () => ({
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}));

describe("Auth recovery pages", () => {
  beforeEach(() => {
    apiPostMock.mockReset();
  });

  it("forgot password shows success even when the request fails", async () => {
    const user = userEvent.setup();
    apiPostMock.mockRejectedValue(new Error("network"));
    renderWithRouter(<ForgotPasswordPage />, { route: "/forgot-password", path: "/forgot-password" });

    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByTestId("reset-success")).toBeVisible();
  });

  it("forgot password keeps the back-to-login link local to the component", () => {
    renderWithRouter(<ForgotPasswordPage />, { route: "/forgot-password", path: "/forgot-password" });

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("reset password validates password confirmation before submit", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ResetPasswordPage />, {
      route: "/reset-password/test-token",
      path: "/reset-password/:token",
    });

    await user.type(screen.getByLabelText("New Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different123");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByTestId("error-confirm_password")).toBeVisible();
  });

  it("reset password shows token error on API failure", async () => {
    const user = userEvent.setup();
    apiPostMock.mockRejectedValue(new Error("expired"));
    renderWithRouter(<ResetPasswordPage />, {
      route: "/reset-password/test-token",
      path: "/reset-password/:token",
    });

    await user.type(screen.getByLabelText("New Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByTestId("token-error")).toBeVisible();
  });
});
