/**
 * AG-067 — technical SEO / GEO discoverability source guards.
 * Keeps AI-facing entity copy aligned with published offer constants.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("robots allow crawl and expose apex sitemap without OAI-SearchBot block", () => {
  const robots = readFileSync(path.join(root, "src/app/robots.ts"), "utf8");
  assert.match(robots, /userAgent:\s*"\*"/);
  assert.match(robots, /allow:\s*"\/"/);
  assert.match(robots, /sitemap:\s*`\$\{SITE_URL\}\/sitemap\.xml`/);
  assert.doesNotMatch(robots, /OAI-SearchBot|GPTBot|Disallow|noindex/i);
});

test("sitemap homepage URL matches apex canonical without trailing slash", () => {
  const sitemap = readFileSync(path.join(root, "src/app/sitemap.ts"), "utf8");
  assert.match(sitemap, /url:\s*SITE_URL/);
  assert.doesNotMatch(sitemap, /url:\s*`\$\{SITE_URL\}\/`/);
  assert.match(sitemap, /SERVICE_LANDING_PATH/);
  assert.match(sitemap, /CASE_STUDY_PATHS/);
  assert.match(sitemap, /\/projects/);
  assert.match(sitemap, /\/privacy/);
});

test("llms.txt stays factually aligned with published offer entity data", () => {
  const llms = readFileSync(path.join(root, "public/llms.txt"), "utf8");
  const offer = readFileSync(path.join(root, "src/lib/offer.ts"), "utf8");

  assert.match(offer, /name:\s*"One-Page Launch"/);
  assert.match(offer, /From \$499 CAD/);
  assert.match(offer, /name:\s*"Business Website"/);
  assert.match(offer, /From \$1,250 CAD/);
  assert.match(offer, /name:\s*"Online Store"/);
  assert.match(offer, /From \$2,000 CAD/);
  assert.match(offer, /name:\s*"Custom Project"/);
  assert.match(offer, /Small Website Repairs/);
  assert.match(offer, /From \$125 CAD/);

  assert.match(llms, /practical digital growth systems/i);
  assert.match(llms, /does not guarantee rankings or revenue/i);
  assert.match(llms, /ongoing growth support is optional/i);
  assert.match(llms, /One-Page Launch/);
  assert.match(llms, /from \$499/);
  assert.match(llms, /Business Website/);
  assert.match(llms, /from \$1,250/);
  assert.match(llms, /Online Store/);
  assert.match(llms, /from \$2,000/);
  assert.match(llms, /Custom Project/);
  assert.match(llms, /Small Website Repairs/);
  assert.match(llms, /from \$125/);
  assert.match(llms, /Victoria/);
  assert.match(llms, /Vancouver Island/);
  assert.match(llms, /contact@eurodigital\.ca/);
  assert.match(llms, /https:\/\/eurodigital\.ca\//);
  assert.match(llms, /Founded:\s*2026/);
  assert.match(llms, /Founder:\s*David Heslop/);
  assert.match(llms, /service-area \/ online-only/i);
  assert.match(llms, /locality only/);
  assert.match(llms, /Monday–Sunday 9:00–17:00/);
  assert.match(llms, /flat \/ project-based \(not hourly\)/i);
  assert.match(llms, /linkedin\.com\/company\/eurodigital-ca/);
  assert.match(llms, /g\.page\/r\/CRysOvkXc9XzEAI\/review/);
  assert.doesNotMatch(llms, /streetAddress|postalCode|V9C|Kangaroo/i);

  // Stale package names/prices from the previous GEO surface must not return.
  assert.doesNotMatch(llms, /One-Page Essentials/);
  assert.doesNotMatch(llms, /Starter Website/);
  assert.doesNotMatch(llms, /Business Launch/);
  assert.doesNotMatch(llms, /Ecommerce Store Launch/);
  assert.doesNotMatch(llms, /from \$299/);
  assert.doesNotMatch(llms, /from \$849/);
  assert.doesNotMatch(llms, /from \$999/);
});

test("root layout keeps indexable metadata and Organization/WebSite schema", () => {
  const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /metadataBase:\s*new URL\(SITE_URL\)/);
  assert.match(layout, /alternates:\s*\{\s*canonical:\s*"\/"/);
  assert.match(layout, /robots:\s*\{\s*index:\s*true,\s*follow:\s*true\s*\}/);
  assert.match(layout, /Websites and growth systems for local businesses/);
  assert.match(layout, /"@type":\s*"Organization"/);
  assert.match(layout, /"@type":\s*"WebSite"/);
  assert.match(layout, /"@type":\s*"ProfessionalService"/);
  assert.match(layout, /SERVICE_AREAS/);
  assert.doesNotMatch(layout, /\bnoindex\b|\bnofollow\b/);
});

test("service areas constant lists eleven Island localities without street address", () => {
  const areas = readFileSync(path.join(root, "src/lib/service-areas.ts"), "utf8");
  const expected = [
    "Victoria",
    "Saanich",
    "Oak Bay",
    "Esquimalt",
    "View Royal",
    "Colwood",
    "Langford",
    "Metchosin",
    "Highlands",
    "Sooke",
    "Sidney",
  ];
  assert.equal(expected.length, 11);
  assert.match(areas, /SERVICE_AREAS/);
  assert.doesNotMatch(areas, /streetAddress|postalCode/);
  for (const name of expected) {
    assert.match(areas, new RegExp(`"${name}"`));
  }
});

test("homepage FAQ emits FAQPage schema for six published-topic questions", () => {
  const home = readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  const faqs = readFileSync(path.join(root, "src/lib/geo-faqs.ts"), "utf8");
  assert.match(home, /GEO_FAQS/);
  assert.match(home, /FAQPage/);
  assert.match(faqs, /What website services does EuroDigital offer/);
  assert.match(faqs, /How does the project process work/);
  assert.match(faqs, /Is pricing hourly or project-based/);
  assert.match(faqs, /Which areas does EuroDigital serve/);
  assert.match(faqs, /How long does a website take/);
  assert.match(faqs, /Is ongoing marketing or support included/);
});
