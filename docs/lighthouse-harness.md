# `npm run lighthouse` harness

Code-level documentation of the repository’s Lighthouse measurement path, verified against `package.json` and `scripts/lighthouse.mjs` on the documenting branch head.

---

## What it runs

1. **npm script** (`package.json`):  
   `lighthouse` → `npm run build && node scripts/lighthouse.mjs`
2. **`scripts/lighthouse.mjs` behaviour:**
   - If `out/` is missing, runs `npm run build` (static Next export).
   - Serves `out/` over HTTP on `127.0.0.1` at port `LH_PORT` or **3456**.
   - For each stock route, runs `npx lighthouse` with:
     - categories: `performance`, `accessibility`, `best-practices`, `seo`
     - `--output=json`
     - Chrome flags: `--headless --no-sandbox`
     - `--quiet`
   - Prints rounded category scores (0–100) to the console.
   - Writes JSON reports under `lighthouse-reports/` as `{slug}.report.json` (`home` for `/`).
   - Closes the local server when finished.

**Stock routes (hard-coded in the script):** `/`, `/projects`, `/privacy` only.

---

## How to read the output

- **Console:** lines like `Scores (home): { performance, accessibility, 'best-practices', seo }` — values are `Math.round(category.score * 100)` from the Lighthouse JSON.
- **JSON reports:** full Lighthouse result objects under `lighthouse-reports/`. Inspect `categories.*.score` (0–1 floats) and individual `audits` for failing checks.
- Exit code is non-zero if build, server, or any Lighthouse child process fails.

---

## Known limits (as implemented)

| Limit | Evidence in source / environment |
| --- | --- |
| Only three routes | `pages = ["/", "/projects", "/privacy"]` in `scripts/lighthouse.mjs` |
| Local static server | Custom `http.createServer` over `out/` — **no gzip/brotli**; text-compression audits can false-positive |
| `images.unoptimized: true` | `next.config.ts` — Next will not emit resized `srcset` for the static Pages export |
| No form-factor / throttling flags in the stock script | Script does not pass `--form-factor` or throttling presets; defaults are whatever the installed `lighthouse` CLI uses |
| Dynamic `[slug]` paths | Stock harness does not measure `/blog/[slug]` or city pages; a local server must map `/path` → `path.html` (the harness’s tryPaths list does) |
| Chrome required | Uses headless Chrome via Lighthouse; unavailable Chrome fails the child process |
| Report directory | `lighthouse-reports/` is created at runtime; not part of the app export |

---

## Related commands

- `npm run build` — produces `out/` consumed by the harness.
- Ad-hoc runs against other routes are outside the stock script (call `npx lighthouse` manually against a local static server if needed); do not treat manual extras as part of `npm run lighthouse` unless the script’s `pages` array is updated in source.
