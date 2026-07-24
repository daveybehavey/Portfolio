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
npm run dev            # local dev → http://127.0.0.1:3011
npm run dev:clean      # clear .next + dev (fixes missing CSS)
npm run build          # static export → out/
npm run sync:brand     # favicon + OG from EuroDigital ASSETS
npm run capture:screens # refresh public/projects/*.webp from live URLs
npm run assets:refresh # sync:brand + capture:screens
npm run lighthouse     # build + Lighthouse scores (see lighthouse-reports/)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run pages:deploy   # PRODUCTION-CHANGING — only after explicit authorization
npm run pages:preview
```

## Deploy

**Current production:** eurodigital.ca remains the previous **manual** Cloudflare Pages deploy. Merging source to GitHub does **not** change production by itself.

**GitHub Actions:** there is **no** active deployment workflow in this repository yet. A future, separately reviewed PR will establish CI and controlled deployment.

**Manual deploy:** `npm run pages:deploy` builds and pushes to Cloudflare Pages (`eurodigital-ca`). That is **production-changing**. Run it only after explicit authorization (requires `wrangler login` or an API token).

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
| `generate_lead` | Contact form submit or `mailto:` click |

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
