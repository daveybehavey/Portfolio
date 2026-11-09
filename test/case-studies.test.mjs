/**
 * Coverage remainder — src/lib/case-studies.ts (and its projects dependency).
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadCaseStudies() {
  const projectsSource = await readFile(join(root, "src/lib/projects.ts"), "utf8");
  const caseSource = await readFile(join(root, "src/lib/case-studies.ts"), "utf8");
  // Rewrite the path alias so the transpiled ESM can import the sibling module.
  const rewritten = caseSource.replace(
    /from\s+["']@\/lib\/projects["']/,
    'from "./projects.mjs"',
  );

  const projectsOut = ts.transpileModule(projectsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "projects.ts",
  }).outputText;

  const caseOut = ts.transpileModule(rewritten, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "case-studies.ts",
  }).outputText;

  const dir = await mkdtemp(join(tmpdir(), "case-studies-"));
  await writeFile(join(dir, "projects.mjs"), projectsOut, "utf8");
  const outFile = join(dir, "case-studies.mjs");
  await writeFile(outFile, caseOut, "utf8");
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

test("getCaseStudy returns maestrosservices and starmapco studies", async () => {
  const { mod, cleanup } = await loadCaseStudies();
  try {
    const maestros = mod.getCaseStudy("maestrosservices");
    assert.equal(maestros.slug, "maestrosservices");
    assert.equal(maestros.path, "/projects/maestrosservices");
    assert.equal(maestros.projectName, "MaestrosServices");
    assert.ok(maestros.liveProof.url);

    const starmap = mod.getCaseStudy("starmapco");
    assert.equal(starmap.slug, "starmapco");
    assert.equal(starmap.path, "/projects/starmapco");
    assert.equal(starmap.projectName, "StarMapCo");
  } finally {
    await cleanup();
  }
});

test("getCaseStudy throws for an unknown slug", async () => {
  const { mod, cleanup } = await loadCaseStudies();
  try {
    assert.throws(
      () => mod.getCaseStudy("unknown-study"),
      /Unknown case study: unknown-study/,
    );
  } finally {
    await cleanup();
  }
});

test("CASE_STUDY_PATHS matches every published study path exactly once", async () => {
  const { mod, cleanup } = await loadCaseStudies();
  try {
    const fromStudies = mod.caseStudies.map((study) => study.path);
    assert.deepEqual(mod.CASE_STUDY_PATHS, fromStudies);
    assert.equal(new Set(mod.CASE_STUDY_PATHS).size, mod.CASE_STUDY_PATHS.length);
    assert.equal(mod.caseStudies.length, 2);
  } finally {
    await cleanup();
  }
});

test("each case study exposes required proof fields without empty stacks", async () => {
  const { mod, cleanup } = await loadCaseStudies();
  try {
    for (const study of mod.caseStudies) {
      assert.ok(study.title);
      assert.ok(study.description);
      assert.ok(study.relationship.label);
      assert.ok(study.relationship.disclosure);
      assert.ok(study.problem);
      assert.ok(study.constraints.length > 0);
      assert.ok(study.implementation.length > 0);
      assert.ok(study.stack.length > 0);
      assert.ok(study.limitations.length > 0);
      assert.ok(study.notClaimed.length > 0);
      assert.ok(study.viewportImages.desktop.src);
      assert.ok(study.viewportImages.tablet.src);
      assert.ok(study.viewportImages.mobile.src);
    }
  } finally {
    await cleanup();
  }
});
