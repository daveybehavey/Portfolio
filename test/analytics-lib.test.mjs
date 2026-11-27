/**
 * Unit coverage for src/lib/analytics.ts pure helpers and gtag gating.
 * No network; gtag is stubbed via vm so `window` resolves under Node.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "src/lib/analytics.ts");

function loadAnalytics(envMeasurementId, { withWindow = false, gtagCalls = null } = {}) {
  const source = readFileSync(sourcePath, "utf8").replace(
    "process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? \"\"",
    JSON.stringify(envMeasurementId ?? ""),
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });

  const module = { exports: {} };
  const require = createRequire(pathToFileURL(sourcePath));
  const context = {
    exports: module.exports,
    require,
    module,
    console,
    process,
  };
  if (withWindow) {
    context.window = {
      gtag(...args) {
        gtagCalls?.push(args);
      },
    };
  }

  vm.runInNewContext(outputText, context, { filename: sourcePath });
  return module.exports;
}

test("isGaEnabled accepts a well-formed GA4 measurement id", () => {
  const { isGaEnabled, GA_MEASUREMENT_ID } = loadAnalytics("G-ABC123XYZ");
  assert.equal(GA_MEASUREMENT_ID, "G-ABC123XYZ");
  assert.equal(isGaEnabled(), true);
});

test("isGaEnabled rejects empty, whitespace, and non-GA ids", () => {
  assert.equal(loadAnalytics("").isGaEnabled(), false);
  assert.equal(loadAnalytics("   ").isGaEnabled(), false);
  assert.equal(loadAnalytics("UA-12345-1").isGaEnabled(), false);
  assert.equal(loadAnalytics("G-").isGaEnabled(), false);
  assert.equal(loadAnalytics("not-a-id").isGaEnabled(), false);
});

test("classifyHref maps mailto, anchors, routes, and externals", () => {
  const { classifyHref } = loadAnalytics("");
  assert.equal(classifyHref("mailto:contact@eurodigital.ca"), "mailto");
  assert.equal(classifyHref("#contact"), "anchor");
  assert.equal(classifyHref("/blog"), "route");
  assert.equal(classifyHref("https://example.com"), "external");
});

test("classifyHref treats empty string as external (boundary)", () => {
  const { classifyHref } = loadAnalytics("");
  assert.equal(classifyHref(""), "external");
});

test("trackCtaClick is a no-op when GA is disabled", () => {
  const calls = [];
  const { trackCtaClick } = loadAnalytics("", {
    withWindow: true,
    gtagCalls: calls,
  });
  trackCtaClick({
    label: "Get a quote",
    location: "header",
    href: "/#contact",
  });
  assert.equal(calls.length, 0);
});

test("trackCtaAndMaybeLead emits cta_click and generate_lead for mailto", () => {
  const calls = [];
  const { trackCtaAndMaybeLead } = loadAnalytics("G-TESTID01", {
    withWindow: true,
    gtagCalls: calls,
  });
  trackCtaAndMaybeLead({
    label: "Email contact",
    location: "contact",
    href: "mailto:contact@eurodigital.ca",
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], "event");
  assert.equal(calls[0][1], "cta_click");
  assert.equal(calls[0][2].link_type, "mailto");
  assert.equal(calls[1][1], "generate_lead");
  assert.equal(calls[1][2].method, "mailto_direct");
});

test("trackCtaAndMaybeLead does not emit generate_lead for non-mailto hrefs", () => {
  const calls = [];
  const { trackCtaAndMaybeLead } = loadAnalytics("G-TESTID01", {
    withWindow: true,
    gtagCalls: calls,
  });
  trackCtaAndMaybeLead({
    label: "Island websites",
    location: "hero",
    href: "/website-design-vancouver-island",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], "cta_click");
  assert.equal(calls[0][2].link_type, "route");
});

test("trackGenerateLead uses mailto (not mailto_direct) when address is not contact@", () => {
  const calls = [];
  const { trackCtaAndMaybeLead } = loadAnalytics("G-TESTID01", {
    withWindow: true,
    gtagCalls: calls,
  });
  trackCtaAndMaybeLead({
    label: "Other",
    location: "footer",
    href: "mailto:hello@example.com",
  });
  assert.equal(calls[1][2].method, "mailto");
});
