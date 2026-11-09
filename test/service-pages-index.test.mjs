/**
 * Coverage remainder — src/lib/service-pages/index.ts and page content modules.
 * Loads the barrel by rewriting @/ imports to transpiled sibling ESM files.
 */
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = join(root, "src/lib/service-pages");

async function loadServicePagesIndex() {
  const dir = await mkdtemp(join(tmpdir(), "service-pages-"));
  const files = (await readdir(pagesDir)).filter((name) => name.endsWith(".ts"));

  for (const name of files) {
    let source = await readFile(join(pagesDir, name), "utf8");
    source = source
      .replace(/from\s+["']@\/lib\/service-landing-types["']/g, 'from "./service-landing-types.mjs"')
      .replace(
        /from\s+["']@\/lib\/service-pages\/([^"']+)["']/g,
        'from "./$1.mjs"',
      );
    // service-landing-types is type-only for the content modules; drop it.
    source = source.replace(
      /import\s+type\s+\{[^}]+\}\s+from\s+["'][^"']+["'];?\s*/g,
      "",
    );

    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
      },
      fileName: name,
    });
    await writeFile(join(dir, name.replace(/\.ts$/, ".mjs")), outputText, "utf8");
  }

  // Minimal stub so any residual type import would resolve if left behind.
  await writeFile(
    join(dir, "service-landing-types.mjs"),
    "export {};\n",
    "utf8",
  );

  try {
    return {
      mod: await import(pathToFileURL(join(dir, "index.mjs")).href),
      cleanup: async () => {
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

test("ADDITIONAL_SERVICE_PATHS matches every page path exactly once", async () => {
  const { mod, cleanup } = await loadServicePagesIndex();
  try {
    const fromPages = mod.ADDITIONAL_SERVICE_PAGES.map((page) => page.path);
    assert.deepEqual(mod.ADDITIONAL_SERVICE_PATHS, fromPages);
    assert.equal(
      new Set(mod.ADDITIONAL_SERVICE_PATHS).size,
      mod.ADDITIONAL_SERVICE_PATHS.length,
    );
    assert.ok(mod.ADDITIONAL_SERVICE_PATHS.length >= 10);
  } finally {
    await cleanup();
  }
});

test("every additional service page has required landing fields", async () => {
  const { mod, cleanup } = await loadServicePagesIndex();
  try {
    for (const page of mod.ADDITIONAL_SERVICE_PAGES) {
      assert.match(page.path, /^\//);
      assert.ok(page.metaTitle);
      assert.ok(page.title);
      assert.ok(page.description);
      assert.ok(page.eyebrow);
      assert.ok(page.introNote);
      assert.ok(page.serviceType);
      assert.ok(page.whoFits.length > 0);
      assert.ok(page.whoDoesNotFit.length > 0);
      assert.ok(page.deepDive.blocks.length > 0);
      assert.ok(page.deliverables.length > 0);
      assert.ok(page.exclusions.length > 0);
      assert.ok(page.dependencies.length > 0);
      assert.ok(page.faqs.length > 0);
      assert.ok(page.cta.title);
      assert.ok(page.cta.body);
      assert.ok(Array.isArray(page.relatedLinks));
    }
  } finally {
    await cleanup();
  }
});

test("city pages declare areaServed entries when present", async () => {
  const { mod, cleanup } = await loadServicePagesIndex();
  try {
    const cityish = mod.ADDITIONAL_SERVICE_PAGES.filter((page) =>
      /web-design-|seo-(?!services)/.test(page.path),
    );
    assert.ok(cityish.length >= 1);
    for (const page of cityish) {
      // Convention in service-landing-types: city pages carry areaServed.
      assert.ok(
        Array.isArray(page.areaServed) && page.areaServed.length > 0,
        `${page.path} missing areaServed`,
      );
      for (const area of page.areaServed) {
        assert.ok(area.name);
        assert.ok(area.type === "City" || area.type === "AdministrativeArea");
      }
    }
  } finally {
    await cleanup();
  }
});
