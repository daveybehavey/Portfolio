/**
 * Phase 3 — structured-data helper invariants (canonical / breadcrumb hygiene).
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadStructuredData() {
  const siteSource = await readFile(join(root, "src/lib/site.ts"), "utf8");
  const sdSource = await readFile(
    join(root, "src/lib/structured-data.ts"),
    "utf8",
  );
  const rewritten = sdSource.replace(
    /from\s+["']@\/lib\/site["']/,
    'from "./site.mjs"',
  );

  const dir = await mkdtemp(join(tmpdir(), "sd-"));
  const siteOut = ts.transpileModule(siteSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "site.ts",
  }).outputText;
  const sdOut = ts.transpileModule(rewritten, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "structured-data.ts",
  }).outputText;
  await writeFile(join(dir, "site.mjs"), siteOut, "utf8");
  const outFile = join(dir, "structured-data.mjs");
  await writeFile(outFile, sdOut, "utf8");
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

test("breadcrumbListJsonLd uses apex SITE_URL without trailing slash for Home", async () => {
  const { mod, cleanup } = await loadStructuredData();
  try {
    const json = mod.breadcrumbListJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]);
    assert.equal(json["@type"], "BreadcrumbList");
    assert.equal(json.itemListElement[0].item, "https://eurodigital.ca");
    assert.doesNotMatch(json.itemListElement[0].item, /\/$/);
    assert.equal(json.itemListElement[1].item, "https://eurodigital.ca/blog");
    assert.equal(json.itemListElement[0].name, "Home");
    assert.equal(json.itemListElement[1].name, "Blog");
  } finally {
    await cleanup();
  }
});

test("SITE_SHARE_IMAGE matches the root-layout share asset path and alt", async () => {
  const { mod, cleanup } = await loadStructuredData();
  try {
    assert.equal(mod.SITE_SHARE_IMAGE.url, "/og-image.png");
    assert.equal(
      mod.SITE_SHARE_IMAGE.alt,
      "EuroDigital — Small business website launches",
    );
    assert.equal(mod.SITE_SHARE_IMAGE.width, 1200);
    assert.equal(mod.SITE_SHARE_IMAGE.height, 630);
  } finally {
    await cleanup();
  }
});
