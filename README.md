<div align="center">

# EuroDigital

**Web development, e-commerce, software, and digital-growth work for small businesses.**

[Portfolio](https://eurodigital.ca) · [GitHub](https://github.com/daveybehavey) · British Columbia, Canada

</div>

---

## Selected Work

| Project | What it demonstrates | Links |
| --- | --- | --- |
| **StarMapCo** | Stateful product editor, e-commerce, fulfillment, recovery flows, automated QA, CI, accessibility, SEO | [Live](https://starmapco.com) · [Code](https://github.com/daveybehavey/starMapAppV2) |
| **NoteBill** | AI-assisted invoice generation, React/TypeScript, Express APIs, PostgreSQL, auth, regression testing | [Code](https://github.com/daveybehavey/Invoice) |
| **AngelKissCreations** | Full-stack storefront, Supabase, PayPal checkout/webhooks, admin tools, Cloudflare deployment | [Live](https://anglkisscreations.ca) · [Code](https://github.com/daveybehavey/AngelKiss) |
| **Maestros Services** | Astro/TypeScript, scalable local SEO, quote flows, GBP/GA4/GSC/Ads tooling, automated checks | [Live](https://maestrosservices.com) · [Code](https://github.com/daveybehavey/MaestrosServices) |
| **Vancouver Island Pro Roofing** | Fast responsive lead-generation site, SEO fundamentals, optimized media, contact conversion | [Live](https://vancouverislandproroofing.com) · [Code](https://github.com/daveybehavey/justin-roofing) |

## What I Work With

**Frontend**  
React · Next.js · Astro · TypeScript · JavaScript · HTML · CSS · Tailwind CSS

**Backend & Data**  
Node.js · Express · PostgreSQL · Supabase · REST APIs · authentication · webhooks

**Commerce & Integrations**  
Stripe · PayPal · Printful · Google APIs · Resend · Cloudflare

**Quality & Delivery**  
Git/GitHub · pull requests · automated tests · Playwright · Lighthouse · CI checks · production preflights

## About This Repository

This repository contains the EuroDigital marketing and portfolio site. It is a production Next.js application deployed on Cloudflare Pages with a live contact flow, automated verification, accessibility/performance checks, and guarded deployment tooling.

### Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 15, React 19 |
| Language | TypeScript / JavaScript |
| UI | Tailwind CSS, Framer Motion |
| Hosting | Cloudflare Pages |
| Contact | Pages Function, Turnstile, Resend |
| QA | Node tests, Playwright, Lighthouse, ESLint, TypeScript checks |

## Engineering Approach

I use a verification-first workflow: changes are reviewed and tested before they are treated as production-ready.

- automated tests for critical behavior
- linting and TypeScript validation
- browser and screenshot checks
- Lighthouse/performance audits
- explicit preview/production preflights
- guarded deployment scripts and rollback documentation

A reviewed EuroDigital production deployment recorded **160/160 tests passing**, and the live contact flow has been verified end to end.

## Local Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Development runs at `http://127.0.0.1:3011`.

### Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run lighthouse
```

## Production Status

Cloudflare Pages native Web Analytics is active on the current production deployment. **GA4 remains disabled** unless it is explicitly enabled in a future authorized change.

- Production source SHA: `348bff05ce4e8d01290cd66c1b79a99aafc68ae4`
- Production deployment ID: `fc18bfa8-56e0-4786-b7d7-7130ece3bcb3`
- Rollback deployment reference: `e6c9ca53-554c-4be9-8bc2-847074a80c7d`

## Operations Documentation

Detailed production/contact documentation remains available under `docs/`:

- [`docs/contact-form-activation.md`](docs/contact-form-activation.md)
- [`docs/production-closeout.md`](docs/production-closeout.md)

---

<div align="center">

**EuroDigital** · Practical web products built for real small-business workflows.

</div>
