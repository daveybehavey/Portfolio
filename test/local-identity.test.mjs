/**
 * Local identity consistency — public phone, tel link, Victoria geo, schema telephone.
 * Source-level guards always run; built HTML assertions run when out/ exists.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");

const PHONE_DISPLAY = "(778) 678-6242";
const PHONE_E164 = "+17786786242";
const TEL_HREF = "tel:+17786786242";
const EMAIL = "contact@eurodigital.ca";

function readOutHtml(route) {
  if (route === "" || route === "/") {
    const index = path.join(outDir, "index.html");
    if (existsSync(index)) return readFileSync(index, "utf8");
    throw new Error("Missing built HTML for homepage");
  }
  const candidate = path.join(outDir, route, "index.html");
  const flat = path.join(outDir, `${route}.html`);
  if (existsSync(candidate)) return readFileSync(candidate, "utf8");
  if (existsSync(flat)) return readFileSync(flat, "utf8");
  throw new Error(`Missing built HTML for ${route}`);
}

test("site constants centralize public phone and Victoria service area", () => {
  const site = readFileSync(path.join(root, "src/lib/site.ts"), "utf8");
  assert.match(site, /CONTACT_PHONE_DISPLAY\s*=\s*"\(778\) 678-6242"/);
  assert.match(site, /CONTACT_PHONE_E164\s*=\s*"\+17786786242"/);
  assert.match(site, /CONTACT_PHONE_HREF\s*=\s*`tel:\$\{CONTACT_PHONE_E164\}`/);
  assert.match(site, /SERVICE_AREA_LABEL\s*=\s*"Victoria & Vancouver Island"/);
  assert.match(site, /Victoria and Vancouver Island/);
  assert.match(site, /CONTACT_EMAIL\s*=\s*"contact@eurodigital\.ca"/);
  assert.doesNotMatch(site, /streetAddress|postalCode|addressLocality/);
});

test("Organization schema includes telephone without LocalBusiness or street address", () => {
  const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /"@type":\s*"Organization"/);
  assert.match(layout, /telephone:\s*CONTACT_PHONE_E164/);
  assert.match(layout, /"Victoria"/);
  assert.match(layout, /"Vancouver Island"/);
  assert.match(layout, /foundingDate:\s*"2026"/);
  assert.match(layout, /name:\s*"David Heslop"/);
  assert.match(layout, /addressLocality:\s*"Victoria"/);
  assert.match(layout, /addressRegion:\s*"BC"/);
  assert.match(layout, /addressCountry:\s*"CA"/);
  assert.match(layout, /linkedin\.com\/company\/eurodigital-ca/);
  assert.match(layout, /cylex-canada\.ca\/company\/eurodigital-25193729/);
  assert.match(layout, /"@type":\s*"ProfessionalService"/);
  assert.match(layout, /openingHours:\s*"Mo-Su 09:00-17:00"/);
  assert.match(layout, /Project-based/);
  assert.doesNotMatch(layout, /\bLocalBusiness\b/);
  assert.doesNotMatch(layout, /streetAddress|postalCode/);
});

test("footer and contact surface phone tel link and email", () => {
  const footer = readFileSync(
    path.join(root, "src/components/SiteFooter.tsx"),
    "utf8",
  );
  assert.match(footer, /CONTACT_PHONE_HREF/);
  assert.match(footer, /CONTACT_PHONE_DISPLAY/);
  assert.match(footer, /CONTACT_EMAIL/);
  assert.match(footer, /SERVICE_AREA_LABEL/);

  const home = readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  assert.match(home, /CONTACT_PHONE_HREF/);
  assert.match(home, /Call \{CONTACT_PHONE_DISPLAY\}/);
  assert.match(home, /Email \{CONTACT_EMAIL\}/);

  const hero = readFileSync(
    path.join(root, "src/components/HeroIntro.tsx"),
    "utf8",
  );
  assert.match(hero, /Victoria & Vancouver Island/);
  assert.match(hero, /Websites \+ growth systems/);
  assert.match(hero, /Repairs from \$125/);
  assert.match(hero, /Small live-site repairs from \$125 CAD/);
});

test("document title reflects website and growth systems positioning", () => {
  const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /EuroDigital — Websites and growth systems for local businesses/);
  assert.doesNotMatch(layout, /EuroDigital — Website launches and small repairs/);
});

test("service landing includes Victoria without doorway stuffing", () => {
  const service = readFileSync(
    path.join(root, "src/lib/service-landing.ts"),
    "utf8",
  );
  assert.match(service, /Victoria & Vancouver Island/);
  assert.match(service, /Victoria and Vancouver Island/);

  const page = readFileSync(
    path.join(root, "src/app/website-design-vancouver-island/page.tsx"),
    "utf8",
  );
  assert.match(page, /eyebrow="Victoria & Vancouver Island"/);
  assert.match(page, /name:\s*"Victoria"/);
  assert.match(page, /service-area business/);
  assert.doesNotMatch(page, /streetAddress|postalCode/);
});

test("built pages expose phone, tel, Victoria, and schema telephone", async (t) => {
  const requireStaticExport = process.env.REQUIRE_STATIC_EXPORT === "1";

  if (!existsSync(outDir)) {
    if (requireStaticExport) {
      assert.fail(
        "REQUIRE_STATIC_EXPORT=1 requires a completed static export at out/",
      );
    }
    t.skip("out/ not built yet — run npm run build first");
    return;
  }

  const home = readOutHtml("/");
  assert.match(home, new RegExp(PHONE_DISPLAY.replace(/[()]/g, "\\$&")));
  assert.match(home, new RegExp(TEL_HREF.replace(/\+/g, "\\+")));
  assert.match(home, new RegExp(EMAIL.replace(/\./g, "\\.")));
  assert.match(home, /Victoria/);
  assert.match(home, /Vancouver Island/);
  assert.match(home, new RegExp(`"telephone"\\s*:\\s*"${PHONE_E164.replace(/\+/g, "\\+")}"`));
  assert.match(home, /"addressLocality"\s*:\s*"Victoria"/);
  assert.match(home, /"@type"\s*:\s*"ProfessionalService"/);
  assert.match(home, /"@type"\s*:\s*"FAQPage"/);
  assert.doesNotMatch(home, /"streetAddress"/);
  assert.doesNotMatch(home, /"postalCode"/);
  assert.doesNotMatch(home, /\bLocalBusiness\b/);

  const service = readOutHtml("website-design-vancouver-island");
  assert.match(service, /Victoria/);
  assert.match(service, new RegExp(TEL_HREF.replace(/\+/g, "\\+")));
  assert.match(service, new RegExp(PHONE_DISPLAY.replace(/[()]/g, "\\$&")));
});
