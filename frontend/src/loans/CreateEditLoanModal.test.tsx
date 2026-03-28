import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateEditLoanModal } from "./CreateEditLoanModal";
import { renderWithRouter } from "@/test/render";

const createLoanState = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const updateLoanState = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

vi.mock("./hooks", () => ({
  useCreateLoan: () => createLoanState,
  useUpdateLoan: () => updateLoanState,
}));

vi.mock("./BorrowerSelect", () => ({
  BorrowerSelect: ({
    onChange,
    error,
  }: {
    onChange: (value: string) => void;
    error?: string;
  }) => (
    <div>
      <button type="button" onClick={() => onChange("borrower-1")}>
        Select Borrower
      </button>
      {error ? <p data-testid="borrower-error">{error}</p> : null}
    </div>
  ),
}));

describe("CreateEditLoanModal", () => {
  beforeEach(() => {
    createLoanState.mutate.mockReset();
    updateLoanState.mutate.mockReset();
  });

  it("keeps installment-count validation in the component layer", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CreateEditLoanModal open onClose={() => {}} />,
    );

    await user.click(screen.getByRole("button", { name: "Select Borrower" }));
    await user.type(screen.getByLabelText("Description"), "Family loan");
    await user.type(screen.getByLabelText(/Principal Amount/i), "1200");
    await user.type(screen.getByLabelText(/Start Date/i), "2026-04-10");
    await user.click(screen.getByRole("button", { name: "Create Loan" }));

    expect(await screen.findByTestId("error-num_payments")).toBeVisible();
    expect(createLoanState.mutate).not.toHaveBeenCalled();
  });
});
