# EuroDigital

**Web development, e-commerce, SaaS, and digital-growth projects for small businesses.**

Live site: https://eurodigital.ca

EuroDigital is my web-development portfolio and client-work brand. The work spans production websites, full-stack applications, e-commerce, payments, databases, analytics, SEO, automated testing, and cloud deployment.

This repository contains the EuroDigital marketing site itself, built with Next.js and deployed on Cloudflare Pages.

## Selected Work

### StarMapCo
Custom star-map e-commerce application with a stateful product editor, checkout/fulfillment flows, automated QA, CI, accessibility work, and production recovery handling.

- Live: https://starmapco.com
- Repository: https://github.com/daveybehavey/starMapAppV2

### NoteBill
AI-assisted invoicing application that converts rough notes or uploaded invoice text into structured, editable invoices, with authentication, PostgreSQL persistence, automated regression coverage, and deployment tooling.

- Repository: https://github.com/daveybehavey/Invoice

### AngelKissCreations
Full-stack e-commerce storefront with product administration, Supabase-backed data, PayPal checkout/webhooks, Cloudflare deployment, automated testing, Lighthouse checks, and image/storage tooling.

- Live: https://anglkisscreations.ca
- Repository: https://github.com/daveybehavey/AngelKiss

### Maestros Services
Production website and growth tooling for a Vancouver Island landscaping business, including localized service pages, quote flows, SEO/structured data, Google Business Profile tooling, GA4/Search Console reporting, and Google Ads integration work.

- Live: https://maestrosservices.com
- Repository: https://github.com/daveybehavey/MaestrosServices

### Vancouver Island Pro Roofing
Responsive local-service website focused on lead generation, mobile usability, SEO fundamentals, optimized media, and straightforward contact flows.

- Live: https://vancouverislandproroofing.com
- Repository: https://github.com/daveybehavey/justin-roofing

## EuroDigital Site Stack

- **Framework:** Next.js 15
- **UI:** React 19, Tailwind CSS, Framer Motion
- **Language:** TypeScript / JavaScript
- **Hosting:** Cloudflare Pages
- **QA:** Node test runner, Playwright, Lighthouse, ESLint, TypeScript checks
- **Contact:** Cloudflare Pages Function, Turnstile, Resend

## Engineering Practices

The project uses a verification-first workflow rather than treating deployment as the test step.

- automated tests for contact and activation-readiness behavior
- linting and TypeScript validation
- Lighthouse/performance checks
- Playwright-driven screenshot and browser tooling
- explicit preview/production preflight checks
- guarded production deployment scripts
- documented rollback and production-closeout procedures

A reviewed production deployment recorded **160/160 tests passing**, and the production contact flow has been verified end to end.

## Local Development

Use the pinned runtime versions from `package.json`, `.nvmrc`, and `.node-version`.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The development server runs at:

```text
http://127.0.0.1:3011
```

## Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run lighthouse
```

Additional preview, contact-form, screenshot, and production-preflight commands are available through `package.json`.

## Deployment & Operations

The site is deployed through Cloudflare Pages using guarded deployment tooling. Normal builds, tests, and CI verification do **not** automatically deploy production.

Detailed operational documentation is kept in:

- [`docs/contact-form-activation.md`](docs/contact-form-activation.md)
- [`docs/production-closeout.md`](docs/production-closeout.md)

## About

EuroDigital is based in British Columbia, Canada and focuses on practical small-business web products: sites that load quickly, work well on mobile, can be maintained, and connect to the services a business actually needs.
