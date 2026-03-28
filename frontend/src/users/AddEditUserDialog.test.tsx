import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddEditUserDialog } from "./AddEditUserDialog";
import { renderWithRouter } from "@/test/render";

const createUserState = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const updateUserState = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const rolesState = vi.hoisted(() => ({
  isLoading: false,
  data: [
    { id: "borrower-role", name: "Borrower" },
    { id: "admin-role", name: "Admin" },
  ],
}));

const toastState = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useCreateUser: () => createUserState,
  useUpdateUser: () => updateUserState,
  useRoles: () => rolesState,
}));

vi.mock("@/notifications/useToast", () => ({
  useToast: () => toastState,
}));

describe("AddEditUserDialog", () => {
  beforeEach(() => {
    createUserState.mutate.mockReset();
    updateUserState.mutate.mockReset();
  });

  it("keeps create-user password validation out of E2E", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <AddEditUserDialog open onClose={() => {}} onSuccess={() => {}} />,
    );

    await user.type(screen.getByLabelText("Full Name"), "Test User");
    await user.type(screen.getByLabelText("Email Address"), "test.user@example.com");
    await user.click(screen.getByLabelText("Borrower"));
    await user.click(screen.getByRole("button", { name: "Save User" }));

    expect(await screen.findByTestId("error-password")).toHaveTextContent(
      "Password must be at least 8 characters",
    );
    expect(createUserState.mutate).not.toHaveBeenCalled();
  });
});
