/**
 * Coverage remainder — src/lib/geo-faqs.ts and src/lib/service-areas.ts
 * Existing seo-geo tests only source-scan these files; these assert runtime shape.
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadTs(relPath) {
  const source = await readFile(join(root, relPath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: relPath,
  });
  const dir = await mkdtemp(join(tmpdir(), "lib-"));
  const outFile = join(dir, "mod.mjs");
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

test("GEO_FAQS exposes six question/answer pairs with non-empty copy", async () => {
  const { mod, cleanup } = await loadTs("src/lib/geo-faqs.ts");
  try {
    assert.equal(mod.GEO_FAQS.length, 6);
    const questions = new Set();
    for (const faq of mod.GEO_FAQS) {
      assert.ok(faq.q);
      assert.ok(faq.a);
      assert.equal(questions.has(faq.q), false);
      questions.add(faq.q);
    }
  } finally {
    await cleanup();
  }
});

test("SERVICE_AREAS lists unique Island localities without street fields", async () => {
  const { mod, cleanup } = await loadTs("src/lib/service-areas.ts");
  try {
    assert.ok(mod.SERVICE_AREAS.length >= 11);
    assert.equal(
      new Set(mod.SERVICE_AREAS).size,
      mod.SERVICE_AREAS.length,
    );
    assert.ok(mod.SERVICE_AREAS.includes("Victoria"));
    assert.ok(mod.SERVICE_AREAS.includes("Parksville"));
    assert.ok(mod.SERVICE_AREAS.includes("Qualicum Beach"));
    for (const area of mod.SERVICE_AREAS) {
      assert.equal(typeof area, "string");
      assert.doesNotMatch(area, /\d/);
      assert.doesNotMatch(area, /street|postal|V\d/i);
    }
  } finally {
    await cleanup();
  }
});
