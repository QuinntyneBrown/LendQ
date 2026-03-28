import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { renderWithRouter } from "@/test/render";

const recordPaymentState = vi.hoisted(() => ({
  mutateAsync: vi.fn<() => Promise<void>>(),
}));

vi.mock("./hooks", () => ({
  useRecordPayment: () => recordPaymentState,
}));

const payment = {
  id: "payment-1",
  loan_id: "loan-1",
  amount_due: 400,
  amount_paid: 0,
  due_date: "2026-04-10",
  paid_date: null,
  original_due_date: null,
  status: "SCHEDULED" as const,
  notes: "",
};

describe("RecordPaymentDialog", () => {
  beforeEach(() => {
    recordPaymentState.mutateAsync.mockReset();
    recordPaymentState.mutateAsync.mockResolvedValue(undefined);
  });

  it("updates the live balance preview without an E2E round-trip", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <RecordPaymentDialog
        open
        onClose={() => {}}
        payment={payment}
        loanId="loan-1"
        outstandingBalance={2000}
      />,
    );

    expect(screen.getByTestId("balance-preview")).toHaveTextContent("$1,600.00");

    await user.clear(screen.getByLabelText("Payment Amount"));
    await user.type(screen.getByLabelText("Payment Amount"), "200");

    expect(screen.getByTestId("balance-preview")).toHaveTextContent("$1,800.00");
  });

  it("shows inline amount validation before any API request", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <RecordPaymentDialog
        open
        onClose={() => {}}
        payment={payment}
        loanId="loan-1"
        outstandingBalance={2000}
      />,
    );

    await user.clear(screen.getByLabelText("Payment Amount"));
    await user.type(screen.getByLabelText("Payment Amount"), "0");
    await user.click(screen.getByRole("button", { name: "Record Payment" }));

    expect(await screen.findByTestId("error-amount")).toBeVisible();
    expect(recordPaymentState.mutateAsync).not.toHaveBeenCalled();
  });
});
