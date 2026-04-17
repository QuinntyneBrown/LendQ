import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoanSummaryCards } from "./LoanSummaryCards";
import type { Loan } from "@/api/types";

function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: "loan-1",
    creditor_id: "cred-1",
    borrower_id: "borr-1",
    creditor_name: "Jane Creditor",
    borrower_name: "Bob Borrower",
    description: "Test loan",
    principal: 5000,
    interest_rate: "5.00",
    notes: "",
    repayment_frequency: "MONTHLY",
    start_date: "2026-02-16",
    status: "ACTIVE",
    outstanding_balance: 3960,
    total_paid: 1320,
    created_at: "2026-02-16T00:00:00",
    updated_at: "2026-04-17T00:00:00",
    ...overrides,
  } as unknown as Loan;
}

describe("LoanSummaryCards", () => {
  it("shows the next unpaid payment date in the Next Payment card, not the loan's start date (bug 2026-04-17-next-payment-card-shows-start-date)", () => {
    render(
      <LoanSummaryCards
        loan={makeLoan()}
        nextPaymentDate="2026-05-17"
      />,
    );

    // Must show May 17, 2026 — the next unpaid payment — NOT Feb 16 (start_date).
    const nextPaymentCard = screen.getByTestId("metric-next-payment");
    expect(nextPaymentCard).toHaveTextContent(/May 17, 2026/i);
    expect(nextPaymentCard).not.toHaveTextContent(/Feb 16, 2026/i);
  });

  it("falls back to start_date when no pending payment date is provided", () => {
    render(<LoanSummaryCards loan={makeLoan()} />);

    const nextPaymentCard = screen.getByTestId("metric-next-payment");
    expect(nextPaymentCard).toHaveTextContent(/Feb 16, 2026/i);
  });

  it("shows a dash when neither a pending payment nor a start date is available", () => {
    render(
      <LoanSummaryCards
        loan={makeLoan({ start_date: "" as unknown as string })}
      />,
    );

    const nextPaymentCard = screen.getByTestId("metric-next-payment");
    expect(nextPaymentCard).toHaveTextContent("—");
  });
});
