/**
 * Issue #17 Phase A — revenue surface invariants.
 * Scans built `out/` when present; also validates source data and sitemap module.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");

const REQUIRED_ROUTES = [
  "website-design-vancouver-island",
  "projects/maestrosservices",
  "projects/starmapco",
];

const CANONICALS = [
  "https://eurodigital.ca/website-design-vancouver-island",
  "https://eurodigital.ca/projects/maestrosservices",
  "https://eurodigital.ca/projects/starmapco",
];

const PROHIBITED_CLAIM_PATTERNS = [
  /\b\d{1,3}%\s+(increase|growth|conversion| uplift)/i,
  /\b(generated|drove|produced)\s+\$\d/i,
  /\b\d{2,}\s*x\s+(ROI|return)/i,
  /\b(guaranteed|guarantee)\s+(ranking|rankings|traffic|#1)\b/i,
  /\baggregateRating\b/i,
  /\bLocalBusiness\b/,
];

function readOutHtml(route) {
  const candidate = path.join(outDir, route, "index.html");
  const flat = path.join(outDir, `${route}.html`);
  if (existsSync(candidate)) return readFileSync(candidate, "utf8");
  if (existsSync(flat)) return readFileSync(flat, "utf8");
  throw new Error(`Missing built HTML for ${route}`);
}

test("source offers keep published package prices", () => {
  const offerSource = readFileSync(path.join(root, "src/lib/offer.ts"), "utf8");
  assert.match(offerSource, /From \$499 CAD/);
  assert.match(offerSource, /From \$1,250 CAD/);
  assert.match(offerSource, /From \$2,000 CAD/);
  assert.match(offerSource, /Quoted per project/);

  const serviceSource = readFileSync(
    path.join(root, "src/lib/service-landing.ts"),
    "utf8",
  );
  assert.match(serviceSource, /from \"@\/lib\/offer\"/);
  assert.match(serviceSource, /PACKAGES/);
});

test("case-study relationship disclosures exist in source", () => {
  const source = readFileSync(
    path.join(root, "src/lib/case-studies.ts"),
    "utf8",
  );
  assert.match(source, /family landscaping and outdoor-services business/i);
  assert.match(source, /owned EuroDigital ecommerce product/i);
  assert.match(source, /not an independent third-party client testimonial/i);
  assert.match(
    source,
    /not presented here as an unrelated third-party client engagement/i,
  );
  assert.doesNotMatch(source, /\bLocalBusiness\b/);
});

test("internal links prevent orphan revenue routes", () => {
  const files = [
    "src/app/page.tsx",
    "src/app/projects/page.tsx",
    "src/components/SiteHeader.tsx",
    "src/components/SiteFooter.tsx",
    "src/components/MobileNav.tsx",
    "src/components/HeroIntro.tsx",
    "src/app/website-design-vancouver-island/page.tsx",
  ];
  const joined = files
    .map((rel) => readFileSync(path.join(root, rel), "utf8"))
    .join("\n");
  for (const route of [
    "/website-design-vancouver-island",
    "/projects/maestrosservices",
    "/projects/starmapco",
  ]) {
    assert.match(joined, new RegExp(route.replace(/\//g, "\\/")));
  }
});

test("production closeout docs record deploy identities without enabling GA4", () => {
  const closeout = readFileSync(
    path.join(root, "docs/production-closeout.md"),
    "utf8",
  );
  assert.match(closeout, /348bff05ce4e8d01290cd66c1b79a99aafc68ae4/);
  assert.match(closeout, /fc18bfa8-56e0-4786-b7d7-7130ece3bcb3/);
  assert.match(closeout, /e6c9ca53-554c-4be9-8bc2-847074a80c7d/);
  assert.match(closeout, /GA4 remains disabled/i);
  assert.match(closeout, /cdn-cgi\/rum/);
  assert.match(closeout, /native Cloudflare insights script/i);

  const readme = readFileSync(path.join(root, "README.md"), "utf8");
  assert.match(readme, /fc18bfa8-56e0-4786-b7d7-7130ece3bcb3/);
  assert.match(readme, /GA4 remains/);
});

test("built revenue routes, metadata, sitemap, and claim guardrails", async (t) => {
  if (!existsSync(outDir)) {
    t.skip("out/ not built yet — run npm run build first");
    return;
  }

  for (const route of REQUIRED_ROUTES) {
    const html = readOutHtml(route);
    assert.ok(html.includes("<h1"), `${route} has an h1`);
    assert.match(
      html,
      new RegExp(
        `<link[^>]+rel="canonical"[^>]+href="https://eurodigital\\.ca/${route}/?"`,
      ),
    );
    assert.doesNotMatch(
      html,
      /googletagmanager\.com|gtag\/js|gtag\(|NEXT_PUBLIC_GA_MEASUREMENT_ID/i,
    );
    assert.doesNotMatch(html, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
    for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
      assert.doesNotMatch(html, pattern, `${route} avoids ${pattern}`);
    }
  }

  const maestros = readOutHtml("projects/maestrosservices");
  assert.match(maestros, /Relationship disclosure/i);
  assert.match(maestros, /family landscaping/i);
  assert.match(maestros, /maestrosservices\.com/);

  const starmap = readOutHtml("projects/starmapco");
  assert.match(starmap, /Relationship disclosure/i);
  assert.match(starmap, /owned/i);
  assert.match(starmap, /starmapco\.com/);

  const service = readOutHtml("website-design-vancouver-island");
  assert.match(service, /From \$499 CAD/);
  assert.match(service, /From \$1,250 CAD/);
  assert.match(service, /From \$2,000 CAD/);
  assert.match(service, /FAQPage/);
  assert.doesNotMatch(service, /LocalBusiness/);

  const sitemapPath = path.join(outDir, "sitemap.xml");
  assert.ok(existsSync(sitemapPath), "sitemap.xml exists");
  const sitemap = readFileSync(sitemapPath, "utf8");
  for (const url of CANONICALS) {
    assert.match(sitemap, new RegExp(url.replace(/\./g, "\\.")));
  }

  // Unique canonicals across new pages
  const canonicals = REQUIRED_ROUTES.map((route) => {
    const html = readOutHtml(route);
    const match = html.match(
      /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i,
    );
    assert.ok(match, `canonical found for ${route}`);
    return match[1].replace(/\/$/, "");
  });
  assert.equal(new Set(canonicals).size, canonicals.length);
});

test("case study and service page modules exist", () => {
  for (const rel of [
    "src/app/website-design-vancouver-island/page.tsx",
    "src/app/projects/maestrosservices/page.tsx",
    "src/app/projects/starmapco/page.tsx",
    "src/components/CaseStudyView.tsx",
    "src/lib/case-studies.ts",
    "src/lib/service-landing.ts",
  ]) {
    assert.ok(existsSync(path.join(root, rel)), rel);
  }

  // Ensure out listing remains stable when built
  if (existsSync(outDir)) {
    const names = readdirSync(outDir);
    assert.ok(names.includes("website-design-vancouver-island") || names.includes("website-design-vancouver-island.html"));
  }
});
