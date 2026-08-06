/**
 * Invariants for Cloudflare Pages native Web Analytics.
 *
 * Scanning rules (so this file is never a false positive):
 * - Forbidden application strings are stored in FORBIDDEN_* constants below and
 *   used only as expected needle values when scanning OTHER repository files.
 * - When walking the tree, skip this test file path and any path under node_modules,
 *   .git, .next, out/coverage, or lighthouse-reports.
 * - Mentions inside README of "beacon.min.js" / "/cdn-cgi/rum" as post-deploy
 *   verification instructions are allow-listed as documentation of edge injection,
 *   not application embedding.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const thisTestFile = fileURLToPath(import.meta.url);

/** Needles that must not appear in application/config sources. */
const FORBIDDEN_TOKEN = "NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN";
const FORBIDDEN_COMPONENT = "CloudflareAnalytics";
const FORBIDDEN_BEACON_SRC = "static.cloudflareinsights.com/beacon.min.js";
const FORBIDDEN_DATA_ATTR = "data-cf-beacon";

const SKIP_DIR_NAMES = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "lighthouse-reports",
  "out",
]);

const APP_CONFIG_GLOBS_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".example",
  ".md",
  ".css",
  ".html",
]);

/**
 * README may mention beacon.min.js /cdn-cgi/rum only as post-deploy verification
 * of Cloudflare edge injection — never as application embedding instructions.
 * The token env var name itself must not appear anywhere outside this test file.
 */
function isBeaconDocAllowList(relPosix) {
  return relPosix === "README.md";
}

async function walkFiles(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (
      !APP_CONFIG_GLOBS_EXT.has(ext) &&
      entry.name !== ".env.example" &&
      entry.name !== "wrangler.jsonc"
    ) {
      continue;
    }
    out.push(full);
  }
  return out;
}

function toRel(full) {
  return path.relative(root, full).split(path.sep).join("/");
}

async function collectMatches(needle, { includeOut = false, includeDocs = false } = {}) {
  const files = await walkFiles(root);
  if (includeOut && existsSync(path.join(root, "out"))) {
    await walkFiles(path.join(root, "out"), files);
  }
  const hits = [];
  for (const full of files) {
    if (path.resolve(full) === path.resolve(thisTestFile)) continue;
    const rel = toRel(full);
    if (!includeDocs && isBeaconDocAllowList(rel)) continue;
    let text;
    try {
      text = await readFile(full, "utf8");
    } catch {
      continue;
    }
    if (text.includes(needle)) hits.push(rel);
  }
  return hits;
}

test("layout does not import or render CloudflareAnalytics", async () => {
  const layout = await readFile(path.join(root, "src/app/layout.tsx"), "utf8");
  assert.equal(layout.includes(FORBIDDEN_COMPONENT), false);
  assert.equal(layout.includes("@/components/CloudflareAnalytics"), false);
});

test("manual CloudflareAnalytics component file is absent", async () => {
  await assert.rejects(
    () => access(path.join(root, "src/components/CloudflareAnalytics.tsx")),
    { code: "ENOENT" },
  );
});

test("tracked application and config files omit NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN", async () => {
  const hits = await collectMatches(FORBIDDEN_TOKEN, { includeDocs: true });
  assert.deepEqual(hits, [], `unexpected token references: ${hits.join(", ")}`);
});

test("application source does not manually load beacon.min.js or data-cf-beacon", async () => {
  const srcHits = await collectMatches(FORBIDDEN_BEACON_SRC, {
    includeDocs: false,
  });
  const attrHits = await collectMatches(FORBIDDEN_DATA_ATTR, {
    includeDocs: false,
  });
  assert.deepEqual(srcHits, [], `beacon src hits: ${srcHits.join(", ")}`);
  assert.deepEqual(attrHits, [], `data-cf-beacon hits: ${attrHits.join(", ")}`);
});

test("privacy page discloses Cloudflare Web Analytics unconditionally", async () => {
  const privacy = await readFile(
    path.join(root, "src/app/privacy/page.tsx"),
    "utf8",
  );
  assert.equal(privacy.includes(FORBIDDEN_TOKEN), false);
  assert.equal(privacy.includes("cfAnalyticsEnabled"), false);
  assert.match(privacy, /Cloudflare Web Analytics/);
  assert.match(privacy, /does not use cookies/);
  assert.match(privacy, /localStorage/);
  assert.match(privacy, /does not fingerprint/);
  assert.match(privacy, /Cloudflare Pages/);
  assert.match(privacy, /isGaEnabled/);
  assert.match(privacy, /Google Analytics 4/);
  assert.equal(
    privacy.includes("This deployment does not load third-party analytics scripts."),
    false,
  );
});

test("generated out/ HTML has zero manual Cloudflare analytics beacons when present", async () => {
  const outDir = path.join(root, "out");
  const requireStaticExport = process.env.REQUIRE_STATIC_EXPORT === "1";

  if (!existsSync(outDir)) {
    if (requireStaticExport) {
      assert.fail(
        "REQUIRE_STATIC_EXPORT=1 requires a completed static export at out/ " +
          "before scanning generated HTML for manual Cloudflare analytics beacons. " +
          "Run npm run build (or the CI Build static export step) first.",
      );
    }
    // Pre-build source suite: out/ scan is optional unless REQUIRE_STATIC_EXPORT=1.
    return;
  }

  const htmlFiles = [];
  async function walkHtml(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkHtml(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(full);
    }
  }
  await walkHtml(outDir);

  assert.ok(htmlFiles.length > 0, "expected HTML files under out/");
  const bad = [];
  for (const full of htmlFiles) {
    const text = await readFile(full, "utf8");
    if (
      text.includes(FORBIDDEN_BEACON_SRC) ||
      text.includes(FORBIDDEN_DATA_ATTR) ||
      text.includes(FORBIDDEN_TOKEN)
    ) {
      bad.push(toRel(full));
    }
  }
  assert.deepEqual(bad, [], `manual beacon markup in out/: ${bad.join(", ")}`);
});
