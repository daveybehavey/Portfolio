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
