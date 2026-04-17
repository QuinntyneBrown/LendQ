import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { lazyWithReload } from "./lazyWithReload";

describe("lazyWithReload", () => {
  let reloadSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    reloadSpy = vi.fn();
    // @ts-expect-error - overriding for test
    delete window.location;
    // @ts-expect-error - minimal stand-in
    window.location = { ...originalLocation, reload: reloadSpy };
  });

  afterEach(() => {
    // @ts-expect-error - restore
    window.location = originalLocation;
  });

  it("returns the module when the factory resolves", async () => {
    const Component = () => null;
    const factory = vi.fn().mockResolvedValue({ default: Component });

    const result = await lazyWithReload(factory);

    expect(result).toEqual({ default: Component });
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("reloads the page on 'Failed to fetch dynamically imported module' (regression — bug 2026-04-17-chunk-404-blank-screen-after-deploy)", async () => {
    const factory = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "Failed to fetch dynamically imported module: https://x/assets/LoanDetailPage-abcd.js",
        ),
      );

    // Resolves never when reload is triggered (page is navigating away);
    // race the promise against a microtask tick so the test can complete.
    const pending = lazyWithReload(factory);
    await new Promise((r) => setTimeout(r, 20));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
    // Don't await `pending` — it intentionally never resolves.
    void pending;
  });

  it("reloads the page on ChunkLoadError", async () => {
    const err = new Error("Loading chunk 42 failed");
    err.name = "ChunkLoadError";
    const factory = vi.fn().mockRejectedValue(err);

    const pending = lazyWithReload(factory);
    await new Promise((r) => setTimeout(r, 20));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
    void pending;
  });

  it("rethrows non-chunk errors so the caller's ErrorBoundary can handle them", async () => {
    const factory = vi.fn().mockRejectedValue(new Error("some business error"));

    await expect(lazyWithReload(factory)).rejects.toThrow("some business error");
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
