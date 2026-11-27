/**
 * Coverage remainder — src/lib/why-choose.ts
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadWhyChoose() {
  const source = await readFile(join(root, "src/lib/why-choose.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "why-choose.ts",
  });
  const dir = await mkdtemp(join(tmpdir(), "why-choose-"));
  const outFile = join(dir, "why-choose.mjs");
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

test("WHY_CHOOSE_INTRO is a non-empty published string", async () => {
  const { mod, cleanup } = await loadWhyChoose();
  try {
    assert.equal(typeof mod.WHY_CHOOSE_INTRO, "string");
    assert.ok(mod.WHY_CHOOSE_INTRO.length > 40);
  } finally {
    await cleanup();
  }
});

test("WHY_CHOOSE_HIGHLIGHT carries headline, body, and bullets", async () => {
  const { mod, cleanup } = await loadWhyChoose();
  try {
    const highlight = mod.WHY_CHOOSE_HIGHLIGHT;
    assert.ok(highlight.headline);
    assert.ok(highlight.body);
    assert.ok(Array.isArray(highlight.bullets));
    assert.ok(highlight.bullets.length >= 3);
    for (const bullet of highlight.bullets) {
      assert.equal(typeof bullet, "string");
      assert.ok(bullet.length > 0);
    }
  } finally {
    await cleanup();
  }
});

test("WHY_CHOOSE_POINTS lists six titled reasons with bodies", async () => {
  const { mod, cleanup } = await loadWhyChoose();
  try {
    assert.equal(mod.WHY_CHOOSE_POINTS.length, 6);
    const titles = new Set();
    for (const point of mod.WHY_CHOOSE_POINTS) {
      assert.ok(point.title);
      assert.ok(point.body);
      assert.equal(titles.has(point.title), false);
      titles.add(point.title);
    }
  } finally {
    await cleanup();
  }
});
