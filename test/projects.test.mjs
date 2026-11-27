/**
 * Coverage remainder — src/lib/projects.ts
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadProjects() {
  const source = await readFile(join(root, "src/lib/projects.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "projects.ts",
  });
  const dir = await mkdtemp(join(tmpdir(), "projects-"));
  const outFile = join(dir, "projects.mjs");
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

test("projects catalog exposes required fields for every entry", async () => {
  const { mod, cleanup } = await loadProjects();
  try {
    assert.ok(mod.projects.length >= 1);
    for (const project of mod.projects) {
      assert.ok(project.name);
      assert.ok(project.tagline);
      assert.match(project.url, /^https:\/\//);
      assert.ok(project.outcome);
      assert.ok(project.bullets.length > 0);
      assert.ok(project.label);
      assert.match(project.imageSrc, /^\/projects\//);
    }
  } finally {
    await cleanup();
  }
});

test("case-study paths only appear on named proof projects", async () => {
  const { mod, cleanup } = await loadProjects();
  try {
    const withCaseStudy = mod.projects.filter((project) => project.caseStudyPath);
    assert.deepEqual(
      withCaseStudy.map((project) => project.name).sort(),
      ["MaestrosServices", "StarMapCo"],
    );
    for (const project of withCaseStudy) {
      assert.equal(
        project.caseStudyPath,
        `/projects/${project.name.toLowerCase()}`,
      );
    }
  } finally {
    await cleanup();
  }
});

test("featured and early-work flags stay mutually exclusive where set", async () => {
  const { mod, cleanup } = await loadProjects();
  try {
    for (const project of mod.projects) {
      if (project.isFeatured && project.isEarlyWork) {
        assert.fail(
          `${project.name} is marked both featured and early-work`,
        );
      }
    }
    const early = mod.projects.filter((project) => project.isEarlyWork);
    assert.ok(early.length >= 1);
    const featured = mod.projects.filter((project) => project.isFeatured);
    assert.ok(featured.length >= 1);
  } finally {
    await cleanup();
  }
});

test("NoteBill is the only project with a Play Store URL", async () => {
  const { mod, cleanup } = await loadProjects();
  try {
    const withPlay = mod.projects.filter((project) => project.playStoreUrl);
    assert.equal(withPlay.length, 1);
    assert.equal(withPlay[0].name, "NoteBill");
    assert.match(withPlay[0].playStoreUrl, /play\.google\.com/);
  } finally {
    await cleanup();
  }
});
