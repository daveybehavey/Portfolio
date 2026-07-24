# EuroDigital portfolio

Static marketing site for [eurodigital.ca](https://eurodigital.ca) — small-business website launches on Vancouver Island (packages, examples, portfolio, contact).

**Stack:** Next.js 15 (static export) · Tailwind · Framer Motion · Cloudflare Pages

**Node.js:** use **22.x** (see `.nvmrc` / `.node-version` and `package.json` `engines`). Chosen because Next.js 15.5 accepts `>=20`, while committed `wrangler` / `miniflare` require `>=22`, without upgrading dependencies.

## Run locally

```powershell
# Use Node 22.x (nvm use / fnm use / equivalent)
npm ci
cp .env.example .env.local   # optional: analytics token
npm run dev
```

Open **http://127.0.0.1:3011** (not `localhost:3010` — another project may be on that port). Windows: double-click `dev.bat`.

If the page looks unstyled, run `npm run dev:clean` (clears a stale `.next` cache and restarts dev).

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
3. Add to `.env.local` (bake into a future authorized deploy if/when CI exists):

   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. Rebuild and deploy.

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

3. Rebuild and deploy. Privacy copy updates automatically on `/privacy`.

## Optional: Cloudflare helpers

`scripts/cf-api.js` — zone lookup, www CNAME, email routing status, contact forward rule. Needs credentials in `.env.local` (see `.env.example`).

## SEO checklist (manual, one-time)

- [Google Search Console](https://search.google.com/search-console) — add property, submit `https://eurodigital.ca/sitemap.xml`
- [Bing Webmaster](https://www.bing.com/webmasters) — same sitemap
- Confirm `contact@eurodigital.ca` forwarding in Cloudflare Email Routing

## License

Private — EuroDigital.
