/**
 * Coverage remainder — src/lib/analytics.ts
 * Deterministic unit tests; no network; GA stays disabled when the env id is unset.
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadAnalytics() {
  const source = await readFile(join(root, "src/lib/analytics.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "analytics.ts",
  });
  const dir = await mkdtemp(join(tmpdir(), "analytics-"));
  const outFile = join(dir, "analytics.mjs");
  await writeFile(outFile, outputText, "utf8");
  try {
    return {
      mod: await import(pathToFileURL(outFile).href),
      cleanup: async () => {
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

test("classifyHref maps mailto, anchor, route, and external inputs", async () => {
  const { mod, cleanup } = await loadAnalytics();
  try {
    const { classifyHref } = mod;
    assert.equal(classifyHref("mailto:contact@eurodigital.ca"), "mailto");
    assert.equal(classifyHref("#contact"), "anchor");
    assert.equal(classifyHref("/website-design-vancouver-island"), "route");
    assert.equal(classifyHref("https://eurodigital.ca"), "external");
  } finally {
    await cleanup();
  }
});

test("classifyHref treats empty and non-prefixed strings as external", async () => {
  const { mod, cleanup } = await loadAnalytics();
  try {
    const { classifyHref } = mod;
    assert.equal(classifyHref(""), "external");
    assert.equal(classifyHref("contact"), "external");
    assert.equal(classifyHref("?projectType=business-website"), "external");
  } finally {
    await cleanup();
  }
});

test("isGaEnabled is false when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset", async () => {
  const previous = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const { mod, cleanup } = await loadAnalytics();
  try {
    assert.equal(mod.GA_MEASUREMENT_ID, "");
    assert.equal(mod.isGaEnabled(), false);
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    } else {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = previous;
    }
    await cleanup();
  }
});

test("track helpers are no-ops without window/gtag when GA is disabled", async () => {
  const previous = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const { mod, cleanup } = await loadAnalytics();
  try {
    // No throw in Node (no window) — intended no-op path.
    assert.doesNotThrow(() =>
      mod.trackCtaClick({
        label: "Request a project estimate",
        location: "hero",
        href: "/#contact",
      }),
    );
    assert.doesNotThrow(() =>
      mod.trackGenerateLead({ method: "contact_form", location: "contact" }),
    );
    assert.doesNotThrow(() =>
      mod.trackCtaAndMaybeLead({
        label: "Email contact",
        location: "footer",
        href: "mailto:contact@eurodigital.ca",
      }),
    );
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    } else {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = previous;
    }
    await cleanup();
  }
});
