/**
 * Guard that reloads the page when a hashed asset under /assets/ fails to
 * load (typical cause: the main entry script in a stale tab references a
 * chunk that was replaced by a later deploy).
 *
 * Listens on `error` events from <script> and <link> tags. If the event's
 * target URL points at our build output, does `window.location.reload()`
 * — at most once per sessionStorage window to prevent infinite loops.
 *
 * Paired with a small inline bootstrap in frontend/index.html that mounts
 * this listener before Vite's main entry script runs, so it works even
 * when the entry itself 404s.
 */

export const ASSET_RELOAD_STORAGE_KEY = "lendq_chunk_reload_at";
export const ASSET_RELOAD_COOLDOWN_MS = 30_000;

export interface AssetReloadDeps {
  storage: { getItem(k: string): string | null; setItem(k: string, v: string): void };
  now: () => number;
  reload: () => void;
}

export function shouldReloadForAssetError(
  target: EventTarget | null,
  deps: AssetReloadDeps,
): boolean {
  if (!target) return false;

  const el = target as HTMLElement & { src?: string; href?: string };
  if (el.tagName !== "SCRIPT" && el.tagName !== "LINK") return false;

  const src = el.src || el.href || "";
  if (!src.includes("/assets/")) return false;

  const lastRaw = deps.storage.getItem(ASSET_RELOAD_STORAGE_KEY);
  if (lastRaw !== null) {
    const last = Number(lastRaw);
    if (deps.now() - last < ASSET_RELOAD_COOLDOWN_MS) return false;
  }

  deps.storage.setItem(ASSET_RELOAD_STORAGE_KEY, String(deps.now()));
  deps.reload();
  return true;
}
