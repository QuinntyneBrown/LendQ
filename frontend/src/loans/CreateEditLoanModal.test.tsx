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

  describe("edit mode field permissions (bug 2026-04-17-edit-loan-wrong-fields-editable)", () => {
    const existingLoan = {
      id: "loan-1",
      creditor_id: "cred-1",
      borrower_id: "borr-1",
      creditor_name: "Jane Creditor",
      borrower_name: "Bob Borrower",
      description: "Personal loan for home improvement",
      principal: 5000,
      interest_rate: "5.00",
      notes: "",
      repayment_frequency: "MONTHLY",
      start_date: "2026-02-16",
      status: "ACTIVE",
      outstanding_balance: 4400,
      total_paid: 880,
      created_at: "2026-02-16T00:00:00",
      updated_at: "2026-02-16T00:00:00",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    it("disables Principal Amount in edit mode (immutable per user guide)", () => {
      renderWithRouter(
        <CreateEditLoanModal open onClose={() => {}} loan={existingLoan} />,
      );
      expect(screen.getByLabelText(/Principal Amount/i)).toBeDisabled();
    });

    it("enables Interest Rate in edit mode (editable per user guide)", () => {
      renderWithRouter(
        <CreateEditLoanModal open onClose={() => {}} loan={existingLoan} />,
      );
      expect(screen.getByLabelText(/Interest Rate/i)).not.toBeDisabled();
    });

    it("disables Start Date in edit mode (immutable per user guide)", () => {
      renderWithRouter(
        <CreateEditLoanModal open onClose={() => {}} loan={existingLoan} />,
      );
      expect(screen.getByLabelText(/Start Date/i)).toBeDisabled();
    });
  });
});
