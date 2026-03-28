import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastContainer } from "./ToastContainer";
import { ToastProvider } from "./ToastProvider";
import { renderWithRouter } from "@/test/render";

describe("ToastProvider", () => {
  it("renders custom notification events without a browser E2E dependency", async () => {
    renderWithRouter(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>,
    );

    window.dispatchEvent(
      new CustomEvent("lendq:notification", {
        detail: { type: "success", message: "Payment received" },
      }),
    );

    expect(await screen.findByTestId("toast-success")).toHaveTextContent("Payment received");
  });
});
