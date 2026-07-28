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
npm run pages:preview:deploy     # guarded Preview deploy (branch contact-preview)
npm run pages:production:build   # build + verify with production sitekey
npm run pages:production:preflight
npm run pages:production:deploy  # PRODUCTION-CHANGING — requires --expected-sha and --authorize-production-deploy
```

`contact:preflight` validates names and formats without printing configuration values. `contact:smoke` requires an exact target-host allowlist and sends only invalid requests that cannot trigger email delivery.

## Deploy

**Current production:** eurodigital.ca remains the previous **manual** Cloudflare Pages deploy. Merging source to GitHub does **not** change production by itself.

**GitHub Actions:** there is **no** active deployment workflow in this repository. CI is verification-only and does not deploy.

**Committed Wrangler configuration:** [`wrangler.jsonc`](wrangler.jsonc) is the source of truth for non-secret Pages settings (project name, output directory, compatibility date, and Preview/Production plain-text variables). Encrypted secrets (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`) remain dashboard/provider-managed and must never be committed.

A Pages direct-upload deploy can replace project configuration. Deploying `out/` with `wrangler pages deploy` **without** this committed configuration is prohibited because it can silently drop required plain-text variables.

**Preview deploy:** `npm run pages:preview:deploy` (optionally `-- --dry-run`). Preview deploy creates and verifies its own artifact; a separately run `pages:preview:build` is useful for inspection only and is not artifact-integrity evidence. Requires git branch and Wrangler `--branch` both `contact-preview`, a clean working tree (no tracked changes or non-ignored untracked files), and committed `wrangler.jsonc`. Neither Preview nor Production may upload an arbitrary pre-existing `out/`. Dry-runs perform full artifact preparation without a Cloudflare request.

**Production deploy:** still requires explicit authorization immediately before setting Production secrets and immediately before deployment:

```powershell
npm run pages:production:preflight
npm run pages:production:deploy -- --expected-sha <exact-main-sha> --authorize-production-deploy
```

Production deploy creates and verifies its own artifact (`pages-build` + `scanBuildAssets`) and rejects any non-ignored untracked files. A separately run `pages:production:build` is useful for inspection only — it is not sufficient authorization or integrity evidence. Ignored `out/` is fine because Git omits it from status. Do not weaken production guards with broad exceptions for local evidence directories.

That path is **production-changing**. Do not run it without authorization. Rollback uses the recorded prior production deployment ID documented in the contact-form activation runbook (currently `f0ddd72c-3740-4340-a9f7-4e98b63cf807`).

## Contact-form activation

The source contains a narrow `/api/contact` Pages Function, but online submission is disabled until reviewed Turnstile, Resend, and Cloudflare Pages configuration is supplied.

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

## Optional: Cloudflare Web Analytics

1. Cloudflare dashboard → **Analytics & logs** → **Web Analytics** → add **eurodigital.ca**
2. Copy the beacon token into `.env.local`:

   ```env
   NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN=your_token_here
   ```

3. Rebuild and deploy (only after explicit authorization if targeting production). Privacy copy updates automatically on `/privacy`.

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
