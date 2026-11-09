# `src/lib/` module reference

Code-level documentation of the public TypeScript modules under `src/lib/`, verified against source on the documenting branch head. This is not marketing copy.

**Placement:** lives in `docs/` alongside the repo’s other operational docs.

**Out of scope here:** `server/`, `scripts/`, React components (except where a lib hook is client-only), and Cloudflare Functions.

---

## Module index

| Module | Role (one line) |
| --- | --- |
| `analytics.ts` | GA4 helpers; no-op when measurement id unset/invalid |
| `blog.ts` | Blog post data + `getBlogPost` / `BLOG_PATHS` |
| `case-studies.ts` | Case-study data + `getCaseStudy` / `CASE_STUDY_PATHS` |
| `geo-faqs.ts` | Six homepage FAQ Q/A strings for FAQPage JSON-LD |
| `lead-attribution.ts` | Client in-memory/URL attribution for contact CTAs |
| `offer.ts` | Packages, repair entry, archetypes, launch-includes lists |
| `projects.ts` | Portfolio project catalog |
| `service-areas.ts` | Locality name list for ProfessionalService `areaServed` |
| `service-landing.ts` | Island website-design hub constants + FAQ/process copy |
| `service-landing-types.ts` | `ServiceLandingContent` and related types |
| `service-page-metadata.ts` | Next `Metadata` builder for service landings |
| `service-pages/` | Per-route service/city content modules + barrel |
| `site.ts` | Site URL, contact email, tagline, default Open Graph bits |
| `usePrefersReducedMotion.ts` | Client hook for `prefers-reduced-motion` |
| `why-choose.ts` | Homepage “why choose” intro/highlight/points |
| `website-needs.ts` | *(name only — deliberate leave; not documented further)* |

---

## `analytics.ts`

**Purpose.** Thin GA4 wrappers used by UI CTAs.

**Public surface.**
- `GA_MEASUREMENT_ID` — trimmed `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` or `""`
- `isGaEnabled()` — `true` only when id matches `/^G-[A-Z0-9]+$/i`
- `classifyHref(href)` — `"mailto"` | `"anchor"` | `"route"` | `"external"` by prefix (`mailto:`, `#`, `/`, else external)
- `trackCtaClick` / `trackGenerateLead` / `trackCtaAndMaybeLead` — call `window.gtag` when enabled; otherwise no-op
- Types: `AnalyticsLocation`, `LeadMethod`, `LinkType`

**Invariants callers rely on.**
- Safe to call on the server or without `gtag`: internal `gtag` returns immediately when `window` is missing or GA is disabled.
- `trackCtaAndMaybeLead` emits `generate_lead` only for `mailto` hrefs; method is `mailto_direct` when the href string includes `contact@`, otherwise `mailto`.
- CTA label sent to GA is truncated to 100 characters.

---

## `blog.ts`

**Purpose.** Static blog catalog for the `/blog` index and `/blog/[slug]` pages.

**Public surface.**
- Type `BlogPost`
- `blogPosts` — readonly array of posts
- `BLOG_PATHS` — `blogPosts.map(p => p.path)`
- `getBlogPost(slug)` — matching post or `undefined`

**Invariants.**
- Each post `path` is `` `/blog/${slug}` ``.
- `getBlogPost` does not throw on unknown slugs (returns `undefined`); route code is expected to `notFound()`.

---

## `case-studies.ts`

**Purpose.** Proof pages for named projects under `/projects/...`.

**Public surface.**
- Types `CaseStudy`, `CaseStudyRelationshipKind`
- `caseStudies` — readonly array
- `getCaseStudy(slug)` — returns study or **throws** `Error("Unknown case study: …")`
- `CASE_STUDY_PATHS`

**Invariants.**
- Depends on `projects.ts` via internal `requireProject`; missing project names throw at module init.
- Slug union is currently `"maestrosservices" | "starmapco"`.

---

## `geo-faqs.ts`

**Purpose.** Fixed list of six `{ q, a }` pairs consumed by homepage FAQPage JSON-LD.

**Public surface.** `GEO_FAQS` (const array).

**Invariants.** Length is six in source; answers are intended to stay aligned with published site copy (enforced by discoverability tests, not by this module).

---

## `lead-attribution.ts`

**Purpose.** Client-side capture of path/UTM/CTA context for contact submissions. Module comment states: URL params + in-memory state only — **no cookies or `localStorage`**. Server sanitization in `server/lead-attribution.mjs` is authoritative.

**Public surface (selected).**
- Type `LeadAttribution`
- `sanitizeClientReferrer` — strips credentials/query/fragment; rejects non-http(s); caps length
- `isContactHref` / `buildContactHref` / `withContactAttribution` — contact URL helpers (`/` + `#contact`, optional `ed_cta` / `ed_loc`)
- `noteInquiryCta` / `observeLocation` / `collectLeadAttribution`
- `resetLeadAttributionSessionForTests` — test-only session reset

**Invariants.**
- First-party referrers (same origin) are not stored as acquisition referrer.
- Landing path is recorded once per in-memory session (first observation).

---

## `offer.ts`

**Purpose.** Commercial offer constants used by homepage and service views: core positioning string, small-repair object, package list, archetypes, and launch-includes list.

**Public surface.**
- `CORE_OFFER` — positioning string
- `SMALL_SITE_REPAIR` — object with name, price fields, badge, copy, examples, CTA href/label
- `FULL_LAUNCH_INCLUDES` — string list
- `LAUNCH_INCLUDES` — **deprecated alias** of `FULL_LAUNCH_INCLUDES` (source `@deprecated` comment)
- `PROJECT_ARCHETYPES` — example cards
- `PACKAGES` — launch package objects (name, price fields, bestFor, features, etc.)

**Invariants.**
- `SMALL_SITE_REPAIR` is intentionally **not** inside `PACKAGES` (source comment).
- Docs here do not reproduce price string values; read `offer.ts` for the published strings.

---

## `projects.ts`

**Purpose.** Portfolio entries for `/projects` cards and case-study linkage.

**Public surface.** Type `Project`; `projects` readonly array.

**Invariants.**
- Optional `caseStudyPath`, `playStoreUrl`, `isFeatured`, `isEarlyWork` flags as present on individual entries.
- Image paths are under `/projects/…`.

---

## `service-areas.ts`

**Purpose.** Ordered list of locality **names** for schema `areaServed` (no street addresses).

**Public surface.** `SERVICE_AREAS`, type `ServiceArea`.

**Actual behaviour.** Source file comment states **13** localities including Parksville and Qualicum Beach; the exported array matches that count.

**Finding (code vs test title).** `test/seo-geo-discoverability.test.mjs` still titles a test “eleven Island localities” while only asserting the original eleven names are present. The lib comment and array agree on 13; the test title is stale relative to the lib.

---

## `service-landing.ts`

**Purpose.** Constants for the Vancouver Island website-design hub route (path, title, description, fit lists, deliverables, FAQs, process, etc.) and re-exports of selected `offer.ts` symbols.

**Public surface.** Path/title/description constants; who-fits / deliverables / exclusions / dependencies / local context / process / FAQs; `SERVICE_PACKAGE_SUMMARY` derived from `PACKAGES`; re-exports `FULL_LAUNCH_INCLUDES`, `PACKAGES`, `SMALL_SITE_REPAIR`.

---

## `service-landing-types.ts`

**Purpose.** Type-only contract for service/city page content modules.

**Public surface.** `ServicePackage`, `SmallSiteRepair`, `ServiceLandingContent` (path, metaTitle, title, description, deepDive, FAQs, `packagesMode`, `areaServed?`, CTA, etc.).

**Invariants.** `packagesMode` is a closed string union (`"all" | "store" | "business" | "repair" | "city" | "none"`). City pages are expected by convention to supply `areaServed` (comment in type file).

---

## `service-page-metadata.ts`

**Purpose.** Builds Next.js `Metadata` for service landings.

**Public surface.** `servicePageMetadata(content)`.

**Behaviour.**
- Strips a trailing `— EuroDigital` or `| EuroDigital` from `content.metaTitle` so the root title template does not double the brand suffix.
- Sets `description`, relative `alternates.canonical` to `content.path`, and Open Graph / Twitter titles as `` `${content.title} — EuroDigital` `` with absolute OG `url` = `SITE_URL + content.path`.

---

## `service-pages/`

**Purpose.** One content module per additional service/city route, plus barrel.

**Barrel (`index.ts`).**
- `ADDITIONAL_SERVICE_PAGES` — ordered const array of content objects
- `ADDITIONAL_SERVICE_PATHS` — mapped paths (consumed by `src/app/sitemap.ts`)
- Named re-exports of each content module

**Invariants.** Paths are unique; each module satisfies `ServiceLandingContent`. Sitemap inclusion is driven by this barrel, not by scanning `src/app/`.

---

## `site.ts`

**Purpose.** Site-wide identity constants.

**Public surface.** `SITE_URL`, `CONTACT_EMAIL`, `SERVICE_AREA_LABEL`, `SITE_TAGLINE`, `BRAND_LOGO_MARK`, `BRAND_LOGO_SQUARE`, `SITE_DESCRIPTION`, `defaultOpenGraph`, `CONTACT_REPLY_NOTE`.

**Invariants.** `SITE_URL` is the apex `https://eurodigital.ca` (no trailing slash). `defaultOpenGraph` carries `siteName`, `locale: "en_CA"`, `type: "website"`, `url: SITE_URL` (images are attached in layout / page metadata, not in this object).

---

## `usePrefersReducedMotion.ts`

**Purpose.** Client component hook (`"use client"`).

**Public surface.** `usePrefersReducedMotion()` → `boolean`.

**Behaviour.** Initial state `false`; after mount, reads `window.matchMedia("(prefers-reduced-motion: reduce)")` and updates on `change`. Used to disable magnetic/button motion when reduced motion is preferred.

---

## `why-choose.ts`

**Purpose.** Homepage “why choose” section copy blocks.

**Public surface.** `WHY_CHOOSE_INTRO`, `WHY_CHOOSE_HIGHLIGHT` (headline/body/bullets), `WHY_CHOOSE_POINTS` (title/body pairs).

---

## `website-needs.ts`

Deliberate leave — **name-only index entry**. Do not document internals or reproduce its copy in this file.

---

## Related app wiring (not lib modules)

For discoverability when reading lib consumers:
- Sitemap: `src/app/sitemap.ts` pulls `BLOG_PATHS`, `CASE_STUDY_PATHS`, `ADDITIONAL_SERVICE_PATHS`, `SERVICE_LANDING_PATH`, `SITE_URL`.
- Robots: `src/app/robots.ts` allows `/` and points at `${SITE_URL}/sitemap.xml`.
- Root Organization / WebSite / ProfessionalService JSON-LD: `src/app/layout.tsx` (uses `SERVICE_AREAS`, `SITE_DESCRIPTION`, `CONTACT_EMAIL`).
