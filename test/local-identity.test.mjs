/**
 * Local identity consistency — email-only public contact, Victoria geo, schema shape.
 * The owner's standing rule scopes the phone number to directory listings only, so
 * the website must not publish it anywhere (display, tel: links, or schema).
 * Source-level guards always run; built HTML assertions run when out/ exists.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");

// The stripped phone number, assembled from fragments so this test does not
// itself keep a publishable copy of the number in the tree.
const PHONE_PARTS = ["778", "678", "6242"];
const PHONE_DISPLAY_RE = new RegExp(
  `\\(?${PHONE_PARTS[0]}\\)?[\\s.-]${PHONE_PARTS[1]}[\\s.-]${PHONE_PARTS[2]}`,
);
const PHONE_E164_RE = new RegExp(`\\+1${PHONE_PARTS.join("")}`);
const TEL_HREF_RE = new RegExp(`tel:\\+1${PHONE_PARTS.join("")}`);
const EMAIL = "contact@eurodigital.ca";

const TEXT_ASSET_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".webmanifest",
  ".xml",
]);

function collectTextAssets(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTextAssets(full));
    } else if (TEXT_ASSET_EXTENSIONS.has(path.extname(entry).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

test("public and source text assets carry no phone anywhere", () => {
  // Static assets under public/ are served verbatim (e.g. /llms.txt), and src/
  // feeds every rendered surface — sweep both trees, not just built HTML.
  for (const dirName of ["public", "src"]) {
    const dir = path.join(root, dirName);
    const files = collectTextAssets(dir);
    assert.ok(files.length > 0, `expected text assets under ${dirName}/`);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const label = path.relative(root, file);
      assert.doesNotMatch(content, PHONE_DISPLAY_RE, label);
      assert.doesNotMatch(content, PHONE_E164_RE, label);
      assert.doesNotMatch(content, TEL_HREF_RE, label);
      assert.doesNotMatch(content, /Phone:/, label);
    }
  }
  // The llms.txt contact block specifically: email present, no phone line.
  const llms = readFileSync(path.join(root, "public/llms.txt"), "utf8");
  assert.match(llms, new RegExp(`Contact: ${EMAIL.replace(/\./g, "\\.")}`));
});

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

test("site constants centralize email contact and Victoria service area, no phone", () => {
  const site = readFileSync(path.join(root, "src/lib/site.ts"), "utf8");
  assert.doesNotMatch(site, /CONTACT_PHONE/);
  assert.doesNotMatch(site, PHONE_DISPLAY_RE);
  assert.doesNotMatch(site, PHONE_E164_RE);
  assert.match(site, /SERVICE_AREA_LABEL\s*=\s*"Victoria & Vancouver Island"/);
  assert.match(site, /Victoria and Vancouver Island/);
  assert.match(site, /CONTACT_EMAIL\s*=\s*"contact@eurodigital\.ca"/);
  assert.doesNotMatch(site, /streetAddress|postalCode|addressLocality/);
});

test("Organization schema carries no telephone, LocalBusiness, or street address", () => {
  const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /"@type":\s*"Organization"/);
  assert.doesNotMatch(layout, /telephone/);
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

test("footer and contact surfaces show email and no phone", () => {
  const footer = readFileSync(
    path.join(root, "src/components/SiteFooter.tsx"),
    "utf8",
  );
  assert.doesNotMatch(footer, /CONTACT_PHONE/);
  assert.doesNotMatch(footer, /tel:/);
  assert.match(footer, /CONTACT_EMAIL/);
  assert.match(footer, /SERVICE_AREA_LABEL/);

  const home = readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  assert.doesNotMatch(home, /CONTACT_PHONE/);
  assert.doesNotMatch(home, /Call \{/);
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

test("built pages expose email and Victoria with no phone anywhere", async (t) => {
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
  assert.doesNotMatch(home, PHONE_DISPLAY_RE);
  assert.doesNotMatch(home, PHONE_E164_RE);
  assert.doesNotMatch(home, TEL_HREF_RE);
  assert.doesNotMatch(home, /"telephone"/);
  assert.match(home, new RegExp(EMAIL.replace(/\./g, "\\.")));
  assert.match(home, /Victoria/);
  assert.match(home, /Vancouver Island/);
  assert.match(home, /"addressLocality"\s*:\s*"Victoria"/);
  assert.match(home, /"@type"\s*:\s*"ProfessionalService"/);
  assert.match(home, /"@type"\s*:\s*"FAQPage"/);
  assert.doesNotMatch(home, /"streetAddress"/);
  assert.doesNotMatch(home, /"postalCode"/);
  assert.doesNotMatch(home, /\bLocalBusiness\b/);

  const service = readOutHtml("website-design-vancouver-island");
  assert.match(service, /Victoria/);
  assert.doesNotMatch(service, TEL_HREF_RE);
  assert.doesNotMatch(service, PHONE_DISPLAY_RE);

  // Built static assets are served verbatim — check the exported llms.txt too.
  const builtLlmsPath = path.join(outDir, "llms.txt");
  assert.ok(existsSync(builtLlmsPath), "expected llms.txt in static export");
  const builtLlms = readFileSync(builtLlmsPath, "utf8");
  assert.doesNotMatch(builtLlms, PHONE_DISPLAY_RE);
  assert.doesNotMatch(builtLlms, PHONE_E164_RE);
  assert.doesNotMatch(builtLlms, /Phone:/);
  assert.match(builtLlms, new RegExp(EMAIL.replace(/\./g, "\\.")));
});
