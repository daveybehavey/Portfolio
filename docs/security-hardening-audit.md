# Security + hardening audit — EuroDigital (eurodigital.ca)

**Audit date:** 2026-11-10  
**Base `main` head:** `3332cd8192480376547f4a81bea26f68265ba624`  
**Auditor branch:** `cursor/security-hardening-audit-9b77`  
**Scope:** evidence-first audit of emitted security headers, dependency advisories (reachability), contact/lead surface (read-only), secrets hygiene (grep-level), and third-party script inventory. Production behaviour changes in this PR are limited to unambiguous Area 1 header work (none required — see Area 1) and invariant test pins.

This document is factual and code-level only. It does not change page copy, pricing wording, lead-form / contact-receiver / attribution / Resend behaviour, or dependencies.

---

## Start gate

### In-flight lanes and no-edit map

| PR | Title | State | Notes |
|----|-------|-------|-------|
| **#68** | perf(a11y): reserve image space… | **Merged** into `main` at `3332cd8` | Part of base; not a no-edit constraint |
| **#69** | perf(bundle): round-2 bundle/asset deep-dive + lib test coverage | Open draft | No-edit |
| **#70** | test(marathon P1): lib coverage remainder… | Open draft | No-edit |
| **#71** | fix(marathon P2): a11y round 2… | Open draft | No-edit |
| Phases 3–4 | — | **Not open** | None found against `main` |

**No-edit map (union of open PR file paths):**

- `#69`: `src/app/globals.css`, `src/components/Accordion.tsx`, `src/components/GoogleAnalytics.tsx`, `src/components/HeroIntro.tsx`, `src/components/MobileNav.tsx`, `test/analytics-lib.test.mjs`, `test/lib-content-helpers.test.mjs`, `test/service-page-metadata.test.mjs`
- `#70`: `test/analytics.test.mjs`, `test/blog.test.mjs`, `test/case-studies.test.mjs`, `test/geo-faqs-and-areas.test.mjs`, `test/projects.test.mjs`, `test/service-page-metadata.test.mjs`, `test/service-pages-index.test.mjs`, `test/why-choose.test.mjs`
- `#71`: `src/components/BlogPostView.tsx`, `src/components/Button.tsx`, `src/components/CaseStudyView.tsx`, `src/components/ServiceLandingView.tsx`

Findings that live only in no-edit files are **flagged**, not fixed, in this PR.

### Surface inventory (from source)

| Concern | Location |
|---------|----------|
| Static response headers | `public/_headers` (copied to `out/_headers` on static export; applied by Cloudflare Pages) |
| Next.js config | `next.config.ts` — `poweredByHeader: false`, `output: "export"`; **no** `headers()` function |
| Contact API response headers | `server/contact.mjs` → `responseHeaders()`; wired via `functions/api/contact.js` |
| Root metadata / third-party wiring | `src/app/layout.tsx` (`GoogleAnalytics`, JSON-LD) |
| GA loader | `src/components/GoogleAnalytics.tsx` + `src/lib/analytics.ts` |
| Contact form | `src/components/ContactForm.tsx` (homepage only via `src/app/page.tsx`) |
| Docs convention | `docs/` (this report: `docs/security-hardening-audit.md`) |
| Deliberate leave | `src/lib/website-needs.ts`, `test/website-needs.test.mjs` — **not edited** |

### Suite + CI audit baseline (untouched base, before this PR’s changes)

- Command: `npm test` → `node --test test/*.test.mjs`
- Result on untouched `main` after `npm ci`, **before** local production build artefacts: **257 tests, 255 pass, 0 fail, 2 skipped**
- CI on `main` head `3332cd8` run [42715879821](https://github.com/daveybehavey/Portfolio/actions/runs/42715879821): **success**, including step **Audit production dependencies** (`npm audit --omit=dev --audit-level=high`) → **green**
- Local confirmation of that CI audit command on untouched base: **0 vulnerabilities**, exit 0

---

## Area 1 — Security headers as actually emitted

### Verification method and limits

1. Read config: `public/_headers`, `next.config.ts`, `server/contact.mjs` `responseHeaders()`.
2. Production build: `npm run build` → inspect `out/_headers` (byte-identical to `public/_headers`).
3. Local Cloudflare Pages semantics: `npx wrangler pages dev out --port 8788 --ip 127.0.0.1`, then `curl -sI` on representative routes.
4. **Limits:** this is **not** a live read of `https://eurodigital.ca`. Local wrangler adds `x-server-env: dev` and `Access-Control-Allow-Origin: *` — those are preview-server artefacts, **not** declared in `public/_headers`, and are not treated as production config. **HSTS** may still be injected by the Cloudflare zone TLS settings in production even when absent from `_headers`; that edge setting was not queried.

### Representative routes checked (wrangler preview)

| Route | Role |
|-------|------|
| `/` | Home (+ contact section `#contact`) |
| `/web-design-victoria-bc` | City / service page |
| `/blog/website-cost-victoria-bc` | Blog page |
| `/privacy` | Privacy page |
| `/api/contact` (OPTIONS / GET → 405) | Contact function headers |

### Emitted static headers (all HTML routes above)

| Header | Value as emitted |
|--------|------------------|
| Content-Security-Policy | **absent** |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| Strict-Transport-Security | **absent** (in `_headers` / wrangler preview) |
| X-Content-Type-Options | `nosniff` |

### Contact API headers (`server/contact.mjs` `responseHeaders`, observed on 405)

| Header | Value as emitted |
|--------|------------------|
| Content-Security-Policy | **absent** |
| X-Frame-Options | **absent** |
| Referrer-Policy | `no-referrer` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| Strict-Transport-Security | **absent** |
| X-Content-Type-Options | `nosniff` |

### Findings

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| A1-F1 | Medium (policy) | **No Content-Security-Policy** on static pages or contact API. | Emitted headers above; `public/_headers` lines 1–5. |
| A1-F2 | Medium (policy) | **No Strict-Transport-Security** in repo `_headers`. Edge may still set HSTS; not verified live. | `public/_headers`; wrangler dump. Choosing `max-age` / `includeSubDomains` / `preload` is a policy design choice. |
| A1-F3 | Low | Contact API responses omit **X-Frame-Options** while static pages set `DENY`. | `server/contact.mjs` `responseHeaders()` (lines 35–48) vs `public/_headers` line 2; wrangler 405 dump. **Not fixed here** — contact-receiver surface is fenced read-only. |
| A1-F4 | Info | Worked example **`X-Content-Type-Options: nosniff` is already present** on both static `/*` and contact API responses. No unambiguous missing-`nosniff` fix remains. | `public/_headers` line 3; `server/contact.mjs` line 39; wrangler dumps. |

### CSP trade-off note (A1-F1) — flagged only, no policy shipped

Current state: no CSP. A candidate direction would be a default-src / script-src policy that allows first-party `/_next/static` scripts, Cloudflare Turnstile (`https://challenges.cloudflare.com`), optional GA (`https://www.googletagmanager.com` / `https://www.google-analytics.com`) when enabled, and Cloudflare insights if edge-injected. Trade-offs: inline JSON-LD in `src/app/layout.tsx` (`dangerouslySetInnerHTML`) and GA’s inline init script in `GoogleAnalytics.tsx` need `'unsafe-inline'` or nonces/hashes; Turnstile and GA break if origins are omitted; overly strict `style-src` can break Tailwind/runtime styles; `frame-ancestors` would overlap with existing `X-Frame-Options: DENY`. **No CSP was guessed or shipped in this PR.**

### Production change in this PR (Area 1)

**None.** The unambiguous `nosniff` gap from the brief’s worked example is already closed on base. Policy-design items (CSP, HSTS parameters) are findings only. Contact API `X-Frame-Options` alignment is fenced (read-only contact surface / no-behaviour change on receiver).

### Test pin

`test/security-headers.test.mjs` locks the existing global `_headers` values (including `nosniff`) without changing runtime behaviour.

---

## Area 2 — Dependency audit (reachability; no upgrades)

### Commands

```bash
npm audit --omit=dev --audit-level=high   # CI step equivalent
npm audit                                  # full tree including devDependencies
```

Environment: Node `v22.23.4` / npm `10.9.9` locally (engines pin Node `22.17.1` / npm `10.9.2`; same lockfile via `npm ci`).

### Delta vs 2026-10-20 record

| 2026-10-20 record | Current (2026-11-10) |
|-------------------|----------------------|
| `next` moderate | **Not in audit** (installed `next@15.5.28`) |
| `sharp` high | **Not in audit** (installed `sharp@0.35.5`, overridden) |
| `source-map-js` high | **Not in audit** (installed `source-map-js@1.2.2`) |
| — | **Production audit (`--omit=dev --audit-level=high`): 0 vulnerabilities** (CI green on base) |
| — | Full tree: **44** vulnerabilities (1 low, 28 moderate, 15 high), all under **devDependency** paths |

**No dependency, lockfile, or version was changed in this PR.**

### Production dependencies

Direct production deps (`next`, `react`, `react-dom`, `framer-motion`) and their production tree: **no advisories** under `npm audit --omit=dev`.

### High-severity advisories (dev / tooling only) — classified

| Package (installed) | Severity | Dependency path (evidence) | Reachability |
|---------------------|----------|----------------------------|--------------|
| `undici@7.24.8` | high | `wrangler` → `miniflare` → `undici` | **Dev/build-tooling only** — Wrangler/Miniflare local Pages tooling; not imported by `src/` or shipped static export |
| `ws@8.18.0` (also `8.21.0` / `7.5.11` under lighthouse) | high | `wrangler`→`miniflare`→`ws`; `lighthouse`→`puppeteer-core`/`ws` | **Dev-only** (preview tooling / Lighthouse harness) |
| `zod@3.25.76` | high | `lighthouse` → `puppeteer-core` → `chromium-bidi` → `zod` | **Dev-only** (Lighthouse / Puppeteer) |
| `js-yaml@4.1.1` | high | `@eslint/eslintrc` → `js-yaml` | **Dev-only** (ESLint) |
| `brace-expansion` (via `minimatch` under eslint / lighthouse / sentry) | high | eslint / lighthouse trees | **Dev-only** |
| `basic-ftp`, `get-uri`, `extract-zip`, `ip-address`, `@puppeteer/browsers`, `puppeteer-core`, `chromium-bidi`, `pac-proxy-agent`, `proxy-agent` | high | `lighthouse` → `puppeteer-core` → … | **Dev-only** (measurement harness) |
| `lighthouse@12.8.2` | high (aggregator) | direct `devDependency` | **Dev-only** (`npm run lighthouse`) |

### Moderate notables (dev)

| Package | Path | Reachability |
|---------|------|--------------|
| `@opentelemetry/*` (via `@sentry/node` under lighthouse) | lighthouse → sentry → otel | Dev-only measurement |
| `minimatch` (typescript-eslint / sentry) | eslint / lighthouse | Dev-only |
| `postcss-selector-parser@6.1.2` | postcss/tailwind build chain | **Build-time-only** (CSS pipeline); not a runtime browser dependency of the static site |

Remediation versions may exist via `npm audit fix` / major lighthouse bumps; **applying them is out of scope** for this PR.

---

## Area 3 — Contact / lead surface (READ-ONLY)

**Nothing in this surface was changed.** The form was never submitted; no test POST was made to any environment.

### Client form (`src/components/ContactForm.tsx`)

- **Fields:** `name` (2–100), `email` (type=email, max 254), `business` (2–160), `projectType` (select from `CONTACT_PROJECT_TYPES`), `message` (20–5000), honeypot `website`, `turnstileToken`, `submissionId`, optional `attribution`.
- **Validation:** HTML5 `required` / `minLength` / `maxLength` / `type="email"`; submit blocked without Turnstile token when online form is configured; server field errors mapped into `fieldErrors`.
- **Honeypot:** off-screen `website` input (`absolute left-[-10000px]…`, `aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`). Value is included in the JSON payload; **server** rejects non-empty honeypot.
- **Anti-spam:** Cloudflare Turnstile script `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set; widget action `"contact"`.
- **Online form gate:** empty site key disables online submit and shows mailto fallback messaging.

### Receiver (`server/contact.mjs`)

- **Bounds:** `MAX_REQUEST_BYTES = 16384`; body length checked via `Content-Length` and encoded byte length.
- **Origin allowlist:** `CONTACT_ALLOWED_ORIGINS`; missing/disallowed origin → 403.
- **Content-Type:** must be `application/json` → else 415.
- **`validateContactPayload`:** trims fields; honeypot `website` non-empty → spam path (400); length/shape checks for name/email/business/projectType/message; Turnstile token required ≤2048 chars; `submissionId` must be UUID; attribution sanitized (never used for routing).
- **Turnstile verify:** Siteverify with timeout; hostname allowlist; dummy-token path only when Cloudflare **documented test** secret + Resend test mailboxes align.
- **Downstream:** durable D1 intake before Resend send; HTML escaped in email body; reply-to = submitter email.
- **No application-level IP rate limit** in this module (abuse controls are Turnstile + origin allowlist + honeypot + size caps).

### Findings (flagged only — no fixes)

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| A3-F1 | Low | Client trusts HTML5 constraints; authoritative validation is server-side only (appropriate, but thin client-side messaging beyond browser defaults). | `ContactForm.tsx` submit path ~232–327; `validateContactPayload` ~138–186 |
| A3-F2 | Low | No in-function request rate limit / 429 path; relies on Turnstile + Cloudflare edge. | `handleContactRequest` — no `rate`/`429` matches in `server/contact.mjs` |
| A3-F3 | Info | Email shape check is a simple regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), not full RFC validation. | `isEmail` ~128–130 |
| A3-F4 | Info | Honeypot is CSS-hidden rather than `type="hidden"`; intentional for bot-fill behaviour. | `ContactForm.tsx` ~481–493; server ~156–158 |

**Downstream lead-loss hole (out of scope):** known issue in the sending account’s domain setup — noted only; not investigated or fixed here.

---

## Area 4 — Secrets hygiene (grep-level)

### Method (reproducible)

`rg` over the repo excluding `node_modules/`, `.git/`, `out/`, `.next/`, `package-lock.json`, with patterns for:

- PEM/private-key markers
- `api_key` / `secret` / `token` / `password` / `bearer` assignments with string literals
- Provider-shaped prefixes (`sk_live_`, `re_`, `ghp_`, `cfpat_`, …)
- Connection-string schemes
- AWS key-shaped `AKIA…`
- JWT-shaped `eyJ…`
- Turnstile/Resend test-key shapes and `NEXT_PUBLIC_*` assignments

### Suspected live secrets

**None found.** No committed `.env` / `.dev.vars` / PEM / private key files (`git ls-files` check).

### Findings / classifications (file + line + class only; **no values**)

| Location | Class | Verdict |
|----------|-------|---------|
| `test/*.test.mjs` (multiple lines; contact-activation, contact-function, contact-intake, lead-attribution, pages-deployment) | Fixture / fake API-key-shaped and Turnstile-shaped **test strings** | Not live secrets |
| `.dev.vars.example:3` | Cloudflare **documented Turnstile always-pass test secret** placeholder | Checked-and-public (Cloudflare test material) |
| `server/contact.mjs:12–14` | Cloudflare documented Turnstile test secret + dummy token constants for preview gate | Checked-and-public test material |
| `scripts/contact-activation-lib.mjs`, `scripts/pages-deployment-lib.mjs` | Cloudflare documented Turnstile **test** site/secret key constants | Checked-and-public |
| `docs/contact-form-activation.md` | Documents Cloudflare test keys in activation runbooks | Checked-and-public documentation |
| `wrangler.jsonc:15` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — **public** Turnstile site key | Checked-and-public |
| `wrangler.jsonc:10` | D1 `database_id` UUID | Checked-and-public infrastructure id |
| `wrangler.jsonc:16–19` | Non-secret contact routing vars (from/to/origins/hostnames) | Checked-and-public config |
| `.env.example` | Empty/`#`-commented secret **names** only | Not findings |
| `scripts/cf-api.js` | Reads `CLOUDFLARE_API_TOKEN` from env; no hardcoded credential | Not a finding |

**No secret value is reproduced in this report, the PR body, or commit messages.**

---

## Area 5 — Third-party script inventory

| Origin / loader | Where wired | Pages | Feature | Need verdict |
|-----------------|-------------|-------|---------|--------------|
| `https://www.googletagmanager.com/gtag/js` + inline `ga4-init` | `src/components/GoogleAnalytics.tsx` via `src/app/layout.tsx` | All pages **when** `NEXT_PUBLIC_GA_MEASUREMENT_ID` matches `G-…` | Optional GA4 | **Accounted for.** Current production build under audit: **GA disabled** (no `googletagmanager` in `out/`). Loader file is on **no-edit map (#69)** — any load-strategy change is deferred. |
| `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` | `src/components/ContactForm.tsx` | Homepage contact section only (`src/app/page.tsx`) | Turnstile spam protection | **Accounted for.** Present in built homepage chunk when site key is configured for the build. |
| Cloudflare Web Analytics (Pages native / edge-injected insights script) | **Not** in application source; dashboard/edge injection | Production edge only | Native Web Analytics | **Accounted for** by deliberate non-embedding; guarded by `test/native-web-analytics.test.mjs`. |
| Google Fonts CDN | — | — | — | **Not loaded at runtime.** `next/font/google` Inter in `layout.tsx` self-hosts at build time. |

### Removals

**Nothing removed.** No third-party loader was proven unreferenced (GoogleAnalytics is imported from root layout; Turnstile is imported from the only ContactForm usage). Search method: ripgrep for `GoogleAnalytics`, `ContactForm`, `challenges.cloudflare.com`, `googletagmanager`, and Cloudflare insights/beacon markers across `src/` and built `out/` HTML/JS.

---

## Production changes in this PR

1. **Header config fixes:** none (see A1-F4 — `nosniff` already present).
2. **Genuine-bug code fixes:** none.
3. **Test pins:** `test/security-headers.test.mjs` — Finding pin **P1** (invariant lock for existing `_headers` security values).
4. **Audit report:** `docs/security-hardening-audit.md` (this file).

### Deliberate non-edits

- Page copy byte-identical to base (diff-verifiable; only new docs + new test file).
- `src/lib/website-needs.ts` and `test/website-needs.test.mjs` untouched.
- No lead-form / contact-receiver / attribution / Resend code touched.
- No pricing wording changed.
- No dependency / lockfile edits.
- No file on the no-edit map edited.
