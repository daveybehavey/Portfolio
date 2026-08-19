import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { readFileSync } from "node:fs";

/**
 * Compile website-needs.ts to CJS in-memory for node:test without a TS runner.
 */
function loadWebsiteNeeds() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const sourcePath = join(root, "src", "lib", "website-needs.ts");
  const source = readFileSync(sourcePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });

  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  const runner = new Function("exports", "require", "module", outputText);
  runner(module.exports, createRequire(pathToFileURL(sourcePath)), module);
  return module.exports;
}

const {
  recommendWebsiteNeed,
  isContactProjectType,
  resolveProjectTypeFromSearch,
  websiteNeedContactHref,
} = loadWebsiteNeeds();

test("existing + fixes recommends Small Website Repairs", () => {
  const rec = recommendWebsiteNeed("existing", "fixes");
  assert.equal(rec.projectType, "small-repair");
  assert.match(rec.startingAround, /\$125/);
  assert.match(rec.disclaimer, /not a binding quote/i);
});

test("sales focus recommends Online Store regardless of presence", () => {
  assert.equal(recommendWebsiteNeed("existing", "sales").projectType, "online-store");
  assert.equal(recommendWebsiteNeed("none", "sales").projectType, "online-store");
});

test("no-site simple launch recommends One-Page", () => {
  const rec = recommendWebsiteNeed("none", "new-site");
  assert.equal(rec.projectType, "one-page");
  assert.match(rec.startingAround, /\$499/);
});

test("leads / outdated / rebuild map to Business Website", () => {
  assert.equal(recommendWebsiteNeed("existing", "leads").projectType, "business-website");
  assert.equal(recommendWebsiteNeed("existing", "outdated").projectType, "business-website");
  assert.equal(recommendWebsiteNeed("existing", "new-site").projectType, "business-website");
  assert.equal(recommendWebsiteNeed("none", "leads").projectType, "business-website");
});

test("custom maps to custom project type", () => {
  assert.equal(recommendWebsiteNeed("existing", "custom").projectType, "custom");
  assert.equal(recommendWebsiteNeed("none", "custom").projectType, "custom");
});

test("contact href carries projectType into home contact anchor", () => {
  assert.equal(
    websiteNeedContactHref("business-website"),
    "/?projectType=business-website#contact",
  );
  assert.equal(
    websiteNeedContactHref("small-repair"),
    "/?projectType=small-repair#contact",
  );
});

test("contact attribution preserves configurator projectType", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const source = readFileSync(join(root, "src", "lib", "lead-attribution.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: join(root, "src", "lib", "lead-attribution.ts"),
  });
  const module = { exports: {} };
  const runner = new Function("exports", "require", "module", outputText);
  runner(module.exports, createRequire(pathToFileURL(join(root, "src", "lib", "lead-attribution.ts"))), module);
  const resolved = module.exports.withContactAttribution(
    "/?projectType=small-repair#contact",
    { ctaLabel: "Request a small repair", ctaLocation: "packages" },
  );
  assert.match(resolved, /projectType=small-repair/);
  assert.match(resolved, /ed_cta=/);
  assert.match(resolved, /#contact$/);
});

test("isContactProjectType validates published values only", () => {
  assert.equal(isContactProjectType("small-repair"), true);
  assert.equal(isContactProjectType(""), false);
  assert.equal(isContactProjectType("not-a-type"), false);
  assert.equal(isContactProjectType(null), false);
});

test("resolveProjectTypeFromSearch prefills valid query values", () => {
  assert.equal(
    resolveProjectTypeFromSearch("?projectType=small-repair"),
    "small-repair",
  );
  assert.equal(
    resolveProjectTypeFromSearch("projectType=business-website&ed_cta=x"),
    "business-website",
  );
});

test("resolveProjectTypeFromSearch ignores invalid or missing projectType", () => {
  assert.equal(resolveProjectTypeFromSearch("?projectType=not-real"), "");
  assert.equal(resolveProjectTypeFromSearch("?foo=bar"), "");
  assert.equal(resolveProjectTypeFromSearch(""), "");
  assert.equal(resolveProjectTypeFromSearch(null), "");
});

test("ContactForm resets controlled projectType after success and keeps it on error", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const form = readFileSync(join(root, "src", "components", "ContactForm.tsx"), "utf8");
  assert.match(form, /resolveProjectTypeFromSearch\(window\.location\.search\)/);
  assert.match(form, /value=\{projectTypeValue\}/);
  assert.match(form, /onChange=\{\(event\) => setProjectTypeValue\(event\.target\.value\)\}/);
  assert.match(form, /form\.reset\(\);\s*setProjectTypeValue\(""\);/s);
  assert.match(
    form,
    /Your entries are still here; retry or use the email link/,
  );
  assert.doesNotMatch(
    form,
    /setProjectTypeValue\(""\);\s*setStatus\(\{\s*state: "error"/s,
  );
});

test("DeviceShowcase uses distinct viewport screenshots, not one cropped image", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const showcase = readFileSync(
    join(root, "src", "components", "DeviceShowcase.tsx"),
    "utf8",
  );
  const studies = readFileSync(join(root, "src", "lib", "case-studies.ts"), "utf8");
  assert.match(showcase, /type="radio"/);
  assert.match(showcase, /not one image cropped/i);
  assert.match(showcase, /max-w-\[min\(100%,320px\)\]/);
  assert.match(studies, /maestrosservices-desktop\.webp/);
  assert.match(studies, /maestrosservices-tablet\.webp/);
  assert.match(studies, /maestrosservices-mobile\.webp/);
  assert.match(studies, /starmapco-desktop\.webp/);
  assert.match(studies, /starmapco-mobile\.webp/);
});

test("WebsiteNeedsConfigurator uses native radio inputs", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const source = readFileSync(
    join(root, "src", "components", "WebsiteNeedsConfigurator.tsx"),
    "utf8",
  );
  assert.match(source, /type="radio"/);
  assert.doesNotMatch(source, /role="radio"/);
  assert.match(source, /min-\[390px\]:grid-cols-2/);
});

test("homepage conversion flow places fit guide before packages before design demo", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const page = readFileSync(join(root, "src", "app", "page.tsx"), "utf8");
  const fit = page.indexOf('id="fit-guide"');
  const packages = page.indexOf('id="packages"');
  const demo = page.indexOf('id="design-demo"');
  assert.ok(fit > -1 && packages > -1 && demo > -1);
  assert.ok(fit < packages, "fit-guide should precede packages");
  assert.ok(packages < demo, "packages should precede design-demo");
});

test("viewport screenshot assets exist for showcase projects", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const required = [
    "maestrosservices-desktop.webp",
    "maestrosservices-tablet.webp",
    "maestrosservices-mobile.webp",
    "starmapco-desktop.webp",
    "starmapco-tablet.webp",
    "starmapco-mobile.webp",
  ];
  for (const name of required) {
    const stat = readFileSync(join(root, "public", "projects", name));
    assert.ok(stat.byteLength > 10_000, `${name} should be a real optimized screenshot`);
    assert.ok(stat.byteLength < 250_000, `${name} should stay compressed`);
  }
});
