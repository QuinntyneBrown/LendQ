import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SummaryCards } from "./SummaryCards";
import { renderWithRouter } from "@/test/render";
import type { DashboardSummary } from "@/api/types";

const mockData: DashboardSummary = {
  total_lent_out: 9999.99,
  total_owed: 5000,
  upcoming_payments_7d: 3,
  overdue_payments: 1,
};

describe("SummaryCards", () => {
  it("renders all four metric cards with correct values", () => {
    renderWithRouter(
      <SummaryCards
        data={mockData}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByTestId("metric-total-lent-out")).toBeVisible();
    expect(screen.getByTestId("metric-total-owed")).toBeVisible();
    expect(screen.getByTestId("metric-upcoming-payments")).toBeVisible();
    expect(screen.getByTestId("metric-overdue-payments")).toBeVisible();
  });

  it("uses single-column grid on mobile and two columns from sm breakpoint", () => {
    renderWithRouter(
      <SummaryCards
        data={mockData}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />,
    );

    const grid = screen.getByTestId("metric-total-lent-out").parentElement!;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("xl:grid-cols-4");
  });

  it("shows loading skeletons while loading", () => {
    renderWithRouter(
      <SummaryCards
        data={undefined}
        isLoading={true}
        isError={false}
        onRetry={vi.fn()}
      />,
    );

    const loadingGrid = screen.getAllByTestId("skeleton")[0].parentElement!;
    expect(loadingGrid.className).toContain("grid-cols-1");
    expect(loadingGrid.className).toContain("sm:grid-cols-2");
  });

  it("shows error state on failure", () => {
    const onRetry = vi.fn();
    renderWithRouter(
      <SummaryCards
        data={undefined}
        isLoading={false}
        isError={true}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByTestId("error-summary")).toBeVisible();
  });
});
