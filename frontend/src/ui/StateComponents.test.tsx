import { AlertCircle } from "lucide-react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { renderWithRouter } from "@/test/render";

describe("UI state components", () => {
  it("renders empty state copy and optional action", () => {
    renderWithRouter(
      <EmptyState
        icon={AlertCircle}
        title="No rows"
        description="Nothing to show"
        action={<Button>Retry</Button>}
      />,
    );

    expect(screen.getByTestId("empty-state")).toHaveTextContent("No rows");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders error state and invokes retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderWithRouter(
      <ErrorState
        name="history"
        message="Failed to load history"
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByTestId("error-history")).toBeVisible();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the requested number of loading skeletons", () => {
    renderWithRouter(<LoadingSkeleton count={3} />);

    expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
  });

  it("renders loading buttons as disabled controls", () => {
    renderWithRouter(<Button isLoading>Saving</Button>);

    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
  });
});
