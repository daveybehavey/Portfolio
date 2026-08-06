# EuroDigital portfolio

Static marketing site for [eurodigital.ca](https://eurodigital.ca) — small-business website launches on Vancouver Island (packages, examples, portfolio, contact).

**Stack:** Next.js 15 (static export) · Tailwind · Framer Motion · Cloudflare Pages

## Runtime (verified)

Use these exact versions before `npm ci` — they reproduce the reviewed clean build:

| Tool | Version |
|------|---------|
| **Node.js** | **22.17.1** (see `.nvmrc` / `.node-version` / `package.json` `engines.node`) |
| **npm** | **10.9.2** (`package.json` `engines.npm` and `packageManager`) |

Pin rationale: Next.js 15.5 accepts `>=20`, while committed `wrangler` / `miniflare` require `>=22`. Exact `22.17.1` / `npm@10.9.2` match the verification environment for this recovery PR.

## Run locally

```powershell
# Switch to Node 22.17.1 and npm 10.9.2 first (nvm use / fnm use / equivalent)
npm ci
cp .env.example .env.local   # optional: analytics token
npm run dev
```

Open **http://127.0.0.1:3011** (not `localhost:3010` — another project may be on that port). Windows: double-click `dev.bat`.

If the page looks unstyled, run `npm run dev:clean` (clears a stale `.next` cache and restarts dev).

### Reproducibility notes (non-blocking)

- `next/font/google` needs network access during `npm run build` to fetch Inter.
- `npm run sync:brand` defaults to the sibling directory `../EuroDigital Invoices/ASSETS` (override with `EURODIGITAL_ASSETS_DIR`).
- Committed generated brand assets under `public/` allow the normal site build to succeed without that external directory. Do not delete the committed copies for local builds.

## Edit content

| What | Where |
|------|--------|
| Projects list | `src/lib/projects.ts` |
| Contact email, tagline, descriptions | `src/lib/site.ts` |
| Homepage sections | `src/app/page.tsx` |
| Portfolio page | `src/app/projects/page.tsx` |
| Global metadata | `src/app/layout.tsx` |
| Favicon / OG images | `public/favicon-*.png`, `public/og-image.png` (from `npm run sync:brand`) |

Project screenshots live in `public/projects/*.webp`. Refresh with `npm run capture:screens` (Playwright).

Brand source files default to `../EuroDigital Invoices/ASSETS` (`logo1254x1254.png`, `logo1122x1402.png`). Override with `EURODIGITAL_ASSETS_DIR`.

## Scripts

```powershell
npm run dev              # local dev → http://127.0.0.1:3011
npm run dev:clean        # clear .next + dev (fixes missing CSS)
npm run build            # static export → out/
npm test                 # contact Function and activation-readiness tests
npm run contact:preflight -- --mode test --env-file .env.local --env-file .dev.vars
npm run contact:smoke -- --url <approved-url> --allow-host <exact-host>
npm run sync:brand       # favicon + OG from EuroDigital ASSETS
npm run capture:screens  # refresh public/projects/*.webp from live URLs
npm run assets:refresh   # sync:brand + capture:screens
npm run lighthouse       # build + Lighthouse scores (see lighthouse-reports/)
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run pages:preview            # local Wrangler Pages dev server for out/
npm run pages:preview:build      # build + verify with Turnstile test sitekey
npm run pages:preview:dry-run    # safe Preview verification (never invokes Wrangler)
npm run pages:deploy:help        # print guarded deploy CLI usage
npm run pages:production:build   # build + verify with production sitekey
npm run pages:production:preflight
```

There are **no** npm scripts that embed `--execute-deploy` or that can initiate a real Pages deployment by themselves. Provider-changing deploys use direct `node scripts/pages-deploy.mjs ...` commands (see Deploy below). Do not treat `npm run ... -- --flag` as a safety boundary on Windows.

`contact:preflight` validates names and formats without printing configuration values. `contact:smoke` requires an exact target-host allowlist and sends only invalid requests that cannot trigger email delivery.

## Deploy

**Current production:** eurodigital.ca is served by Cloudflare Pages deployment `e6c9ca53-554c-4be9-8bc2-847074a80c7d` from source SHA `887d9abb55f5ef3c085e2497b7a56c137a847e7d` (160/160 tests passing at deploy). Online contact submission is **live and verified** (one confirmed end-to-end delivery to `contact@eurodigital.ca`). The previous deployment `f0ddd72c-3740-4340-a9f7-4e98b63cf807` remains the documented rollback reference. Merging source to GitHub still does **not** change production by itself — Production deploys require an explicitly authorized guarded `pages-deploy` invocation.

**GitHub Actions:** there is **no** active deployment workflow in this repository. CI is verification-only and does not deploy.

**Committed Wrangler configuration:** [`wrangler.jsonc`](wrangler.jsonc) is the source of truth for non-secret Pages settings. Top-level `vars` are the reviewed local/Production plain-text configuration; `env.preview.vars` overrides Preview. There is no `env.production` block — Cloudflare Pages applies top-level bindings to Production. The committed file is parsed with a real JSONC parser (comments and trailing commas allowed). Guarded helpers load and validate root `wrangler.jsonc` independently, then launch Wrangler with `cwd` set to the repository root so Pages **auto-discovers** that file. Never pass `--config` / `-c` to Wrangler Pages commands. Guarded deploy helpers spawn processes with `shell: false`; on Windows, `npm`/`npx` run via Node’s official CLI scripts (not `cmd.exe`) so spaced commit messages and metacharacters stay one argv each. Encrypted secrets (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`) remain dashboard/provider-managed and must never be committed.

A Pages direct-upload deploy can replace project configuration. Deploying `out/` with `wrangler pages deploy` **without** this committed configuration is prohibited because it can silently drop required plain-text variables.

**Safe by default:** `scripts/pages-deploy.mjs` never invokes Wrangler unless `--execute-deploy` is present. A missing or dropped `--dry-run` flag does **not** deploy. `--dry-run` remains an explicit alias for the default safe mode and cannot be combined with `--execute-deploy`.

**Failed Preview attempt (2026-07-29):** An authorized final Preview verification from `main` `73ae44c` failed before creating a deployment. Windows `npm run … -- --dry-run` dropped `--dry-run`, and Wrangler rejected unsupported `--config=wrangler.jsonc`. Zero Preview deployments were created; Production was unchanged. This PR removes custom `--config` and makes non-execution the default. Another Preview attempt requires **new immediate authorization** after this PR is reviewed and merged. Do not claim that final Preview verification succeeded.

**Preview — safe verification** (direct Node; never deploys):

```powershell
node scripts/pages-deploy.mjs --target preview --dry-run
```

**Preview — actual deployment** (only after immediate authorization):

```powershell
node scripts/pages-deploy.mjs `
  --target preview `
  --execute-deploy `
  --authorize-preview-deploy
```

Preview requires git branch and Wrangler `--branch` both `contact-preview`, a clean working tree, and committed root `wrangler.jsonc`. Preview does **not** refresh or require live `origin/main`.

**Production — safe verification:**

```powershell
node scripts/pages-production-preflight.mjs --expected-sha <exact-main-sha> --rollback-deployment-id <current-production-deployment-id> --authorize-production-deploy
node scripts/pages-deploy.mjs `
  --target production `
  --expected-sha <exact-main-sha> `
  --rollback-deployment-id <current-production-deployment-id> `
  --authorize-production-deploy `
  --dry-run
```

**Production — actual deployment** (only after immediate authorization):

```powershell
node scripts/pages-deploy.mjs `
  --target production `
  --expected-sha <exact-main-sha> `
  --rollback-deployment-id <current-production-deployment-id> `
  --authorize-production-deploy `
  --execute-deploy
```

Production still refreshes live `origin/main` twice, requires a clean tree, matching `--expected-sha`, and an operator-supplied `--rollback-deployment-id`.

**Emergency contact-form disable** (actual; committed bindings unchanged):

```powershell
node scripts/pages-deploy.mjs `
  --target production `
  --expected-sha <exact-main-sha> `
  --rollback-deployment-id <current-production-deployment-id> `
  --disable-contact-form `
  --authorize-contact-form-disable `
  --authorize-production-deploy `
  --execute-deploy
```

That path is **production-changing**. Do not run it without authorization. Rollback IDs are captured per deployment from Cloudflare and are never permanently hardcoded in source.

## Contact-form activation

The source contains a narrow `/api/contact` Pages Function. **Production** online submission is **live** on eurodigital.ca (deployment `e6c9ca53-554c-4be9-8bc2-847074a80c7d`, source `887d9abb55f5ef3c085e2497b7a56c137a847e7d`), with reviewed Turnstile, Resend, and Cloudflare Pages configuration already applied and verified. The mailto fallback remains available. Rollback reference for the prior Production deployment: `f0ddd72c-3740-4340-a9f7-4e98b63cf807`.

Follow [`docs/contact-form-activation.md`](docs/contact-form-activation.md) for:

- official test credentials and safe Resend test destinations
- local and preview configuration preflight
- non-delivery endpoint smoke checks
- browser and accessibility verification
- production domain and Turnstile preparation
- final deployment gates and rollback

`.dev.vars*` and `.env*` local files are ignored. Only `.dev.vars.example` and `.env.example` are intended for source control.

## Optional: Google Analytics 4 (conversion tracking)

1. [Google Analytics](https://analytics.google.com/) → create property for **eurodigital.ca**
2. **Admin → Data streams → Web** → copy **Measurement ID** (`G-XXXXXXXX`)
3. Add to `.env.local` (bake into a future authorized deploy if/when a separately reviewed CI workflow exists):

   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. Rebuild and deploy (only after explicit authorization if targeting production).

**Events sent from this site:**

| Event | When |
|-------|------|
| `cta_click` | Quote buttons, nav, hero CTAs (`cta_location`, `cta_text`) |
| `generate_lead` | Confirmed contact-form delivery or a direct `mailto:` contact action |

In GA4: **Admin → Events → Mark as key event** on `generate_lead` (and optionally `cta_click`) for reporting.

## Cloudflare Web Analytics (Pages native injection)

Cloudflare Pages **native** Web Analytics is dashboard-managed for the
`eurodigital-ca` project. When enabled under the project **Metrics** panel,
Cloudflare automatically edge-injects the JavaScript beacon on the **next**
deployment. Application source intentionally contains **no** manual beacon
token and **no** manual `beacon.min.js` / `data-cf-beacon` script.

This repository must not reintroduce a token-based or component-based manual
beacon path. Native Pages injection is the only supported Cloudflare Web
Analytics configuration for eurodigital.ca.

**Pre-edge / local builds:** Generated `out/` HTML from `npm run build` or
`npm run pages:production:build` should contain **zero** Cloudflare analytics
beacon scripts. Injection happens at Cloudflare’s edge after an authorized
Pages deployment, not during the local static export.

**Production status:** Native Web Analytics is enabled on the Pages project and
was activated by Production deployment
`fc18bfa8-56e0-4786-b7d7-7130ece3bcb3` from source
`348bff05ce4e8d01290cd66c1b79a99aafc68ae4`. Rollback reference for that run:
`e6c9ca53-554c-4be9-8bc2-847074a80c7d`. Evidence is recorded in
[`docs/production-closeout.md`](docs/production-closeout.md). **GA4 remains
disabled** unless a separately authorized change sets
`NEXT_PUBLIC_GA_MEASUREMENT_ID`.

**Post-deployment verification (for future authorized Production deploys):**

1. Exactly one `beacon.min.js` script on the rendered Production page HTML.
2. At least one `/cdn-cgi/rum` beacon request from a real browser session.
3. Analytics data visible in the Cloudflare Web Analytics dashboard.
4. Contact-form non-delivery smoke tests passing.
5. One authorized real form submission successfully delivered.
6. No unexpected browser console or page errors.

Reference: [Enable Web Analytics on Pages](https://developers.cloudflare.com/pages/how-to/web-analytics/).

## Cloudflare helper commands (`scripts/cf-api.js`)

Manual CLI only. Requires Cloudflare credentials in `.env.local` (see `.env.example`). **Not** invoked by `npm install`, `npm ci`, `build`, `lint`, `typecheck`, tests, or any GitHub Actions workflow in this repository.

| Command | Classification | Effect | Authorization requirement |
|---------|----------------|--------|---------------------------|
| `zone-id` | READ-ONLY | Looks up a Cloudflare zone id by name (GET) | Cloudflare credentials required; safe for inspection |
| `email-routing-status` | READ-ONLY | Reports email routing settings, rules, and MX records (GET) | Cloudflare credentials required; safe for inspection |
| `ensure-www-cname` | PRODUCTION-CHANGING | Creates or updates the production `www.eurodigital.ca` CNAME DNS record | Changes live Cloudflare DNS. Requires valid credentials. Do **not** run for testing or routine local development. Requires **explicit authorization immediately before** execution. Never invoke from install, build, lint, tests, or CI unless a separately approved workflow exists. |
| `ensure-contact-forward` | PRODUCTION-CHANGING | May create a Cloudflare Email Routing destination; may create an enabled `contact@eurodigital.ca` forward rule; may trigger destination-verification email | Changes live Cloudflare email routing. Requires valid credentials. Do **not** run for testing or routine local development. Requires **explicit authorization immediately before** execution. Never invoke from install, build, lint, tests, or CI unless a separately approved workflow exists. |
| `create-www-forward-page-rule` | PRODUCTION-CHANGING | Creates an active production page rule redirecting `www.eurodigital.ca/*` → `https://eurodigital.ca/$1` (301) | Changes live Cloudflare page rules. Requires valid credentials. Do **not** run for testing or routine local development. Requires **explicit authorization immediately before** execution. Never invoke from install, build, lint, tests, or CI unless a separately approved workflow exists. |

Example (read-only only unless authorized):

```powershell
node scripts/cf-api.js zone-id eurodigital.ca
node scripts/cf-api.js email-routing-status <zoneId>
```

## SEO checklist (manual, one-time)

- [Google Search Console](https://search.google.com/search-console) — add property, submit `https://eurodigital.ca/sitemap.xml`
- [Bing Webmaster](https://www.bing.com/webmasters) — same sitemap
- Confirm `contact@eurodigital.ca` forwarding in Cloudflare Email Routing

## License

Private — EuroDigital.
