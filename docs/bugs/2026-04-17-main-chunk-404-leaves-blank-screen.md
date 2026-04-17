---
id: 2026-04-17-main-chunk-404-leaves-blank-screen
title: Main entry script 404 after deploy leaves a permanently blank screen
status: open
severity: high
area: frontend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

Iteration 2's fix (`lazyWithReload`) auto-reloads when a lazily-imported route chunk 404s after a deploy. But the **main entry script** in `dist/index.html` also has a hashed filename that changes every build. When a stale tab's HTML references an old `/assets/index-<hash>.js` that no longer exists on the CDN, the browser's `<script type="module">` tag simply fails to load. No JavaScript runs, no lazy import is attempted, and the user sees a permanently blank viewport.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v9611447`
- Browser: Chromium via `playwright-cli`

## Steps to reproduce

1. Sign in as any user on staging.
2. While the tab is open, trigger a new frontend deploy (any push to `main`).
3. Wait for the Static Web App to swap its contents.
4. Navigate anywhere in the SPA (or hard-refresh the current URL).
5. Observe: blank viewport. Console shows:
   ```
   [ERROR] Failed to load resource: the server responded with a status of 404 ()
     @ https://lemon-wave-0a1790b0f.6.azurestaticapps.net/assets/index-DBCOSgDl.js:0
   ```

## Expected behavior

When the main entry script 404s, the app should detect it and trigger a one-time `window.location.reload()` so the browser picks up fresh HTML with the current hash — the same strategy `lazyWithReload` already uses for route chunks. The user should experience at most a brief flicker, never a dead tab.

## Actual behavior

Permanently blank page. No JS executed; no lazy imports trapped; no auto-reload. The only recovery is a manual hard-refresh.

## Root cause analysis

`frontend/dist/index.html` (Vite output) includes something like:

```html
<script type="module" crossorigin src="/assets/index-DYpgOtkc.js"></script>
```

When that URL 404s the `<script>` tag silently fails. `lazyWithReload` in `frontend/src/utils/lazyWithReload.ts` only wraps `React.lazy(() => import(...))`, which only fires for **route** chunks that are dynamically imported from the entry bundle. The entry bundle itself has nothing to wrap — by the time any of our code could run, the entry bundle has to be loaded.

## Suggested fix

Add an inline `<script>` in `frontend/index.html` **above** the Vite-injected entry script. It listens for `error` events bubbling from failed `<script>` or `<link rel="modulepreload">` loads and, if it detects a missing `/assets/...` asset, reloads the page. Guard with `sessionStorage` to prevent reload loops (e.g. skip if we already reloaded in the last 30 seconds).

Sketch:

```html
<script>
  (function () {
    var KEY = "lendq_chunk_reload_at";
    window.addEventListener("error", function (e) {
      var t = e.target;
      if (!t || (t.tagName !== "SCRIPT" && t.tagName !== "LINK")) return;
      var src = t.src || t.href || "";
      if (src.indexOf("/assets/") === -1) return;
      var last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < 30000) return;  // break the loop
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    }, true);
  })();
</script>
```

Place this in `frontend/index.html` inside `<head>` before the `<script type="module">` line. Vite preserves the inline script untouched through the build.

## Impact and workaround

High. Every user whose tab is open during a deploy loses access until they hard-refresh. The `lazyWithReload` fix only helped for the subset of cases where a lazily-imported chunk 404s during navigation; this bug covers the more common case of the entry bundle itself.

Workaround: hard-refresh (`Ctrl+Shift+R`).

## Related

- Upstream fix: `docs/bugs/2026-04-17-chunk-404-blank-screen-after-deploy.md` (covered lazy chunks only)
- File: `frontend/index.html`
