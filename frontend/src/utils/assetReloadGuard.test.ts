import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  shouldReloadForAssetError,
  ASSET_RELOAD_STORAGE_KEY,
  ASSET_RELOAD_COOLDOWN_MS,
} from "./assetReloadGuard";

function makeDeps(overrides: Partial<Parameters<typeof shouldReloadForAssetError>[1]> = {}) {
  const store = new Map<string, string>();
  return {
    storage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    },
    now: () => 1000,
    reload: vi.fn(),
    ...overrides,
  };
}

function makeScriptTag(src: string): EventTarget {
  return { tagName: "SCRIPT", src } as unknown as EventTarget;
}

function makeLinkTag(href: string): EventTarget {
  return { tagName: "LINK", href } as unknown as EventTarget;
}

describe("shouldReloadForAssetError — bug 2026-04-17-main-chunk-404-leaves-blank-screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reloads the page when a <script> tag under /assets/ fails to load", () => {
    const deps = makeDeps();
    const target = makeScriptTag("https://x/assets/index-ABC.js");

    const result = shouldReloadForAssetError(target, deps);

    expect(result).toBe(true);
    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it("reloads for a <link rel=modulepreload> under /assets/", () => {
    const deps = makeDeps();
    const target = makeLinkTag("https://x/assets/vendor-DEF.js");

    shouldReloadForAssetError(target, deps);

    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it("ignores non-script, non-link targets", () => {
    const deps = makeDeps();
    const img = { tagName: "IMG", src: "https://x/assets/foo.png" } as unknown as EventTarget;

    shouldReloadForAssetError(img, deps);

    expect(deps.reload).not.toHaveBeenCalled();
  });

  it("ignores scripts that are not under /assets/", () => {
    const deps = makeDeps();
    const target = makeScriptTag("https://cdn.example.com/thirdparty.js");

    shouldReloadForAssetError(target, deps);

    expect(deps.reload).not.toHaveBeenCalled();
  });

  it("does not reload twice within the cooldown window (prevents infinite loops)", () => {
    const deps = makeDeps();
    const target = makeScriptTag("https://x/assets/index-ABC.js");

    shouldReloadForAssetError(target, deps);
    shouldReloadForAssetError(target, deps);

    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again once the cooldown has elapsed", () => {
    let currentTime = 1000;
    const deps = makeDeps({ now: () => currentTime });
    const target = makeScriptTag("https://x/assets/index-ABC.js");

    shouldReloadForAssetError(target, deps);
    currentTime += ASSET_RELOAD_COOLDOWN_MS + 1;
    shouldReloadForAssetError(target, deps);

    expect(deps.reload).toHaveBeenCalledTimes(2);
  });

  it("persists the reload timestamp under the expected storage key", () => {
    const deps = makeDeps();
    const target = makeScriptTag("https://x/assets/index-ABC.js");

    shouldReloadForAssetError(target, deps);

    expect(deps.storage.getItem(ASSET_RELOAD_STORAGE_KEY)).toBe("1000");
  });
});
