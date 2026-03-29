import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";
import { renderWithRouter } from "@/test/render";

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("Modal", () => {
  beforeEach(() => {
    setViewport(1280);
  });

  it("renders desktop dialog chrome on wide screens", () => {
    renderWithRouter(
      <Modal open onClose={() => {}} title="Desktop Modal">
        <button type="button">Focusable</button>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("rounded-modal");
    expect(dialog).toHaveClass("max-h-[90vh]");
  });

  it("renders fullscreen on mobile widths", () => {
    setViewport(375);
    renderWithRouter(
      <Modal open onClose={() => {}} title="Mobile Modal">
        <button type="button">Focusable</button>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("w-full");
    expect(dialog).toHaveClass("rounded-t-modal");
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(
      <Modal open onClose={onClose} title="Closable Modal">
        <button type="button">Focusable</button>
      </Modal>,
    );

    await user.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
