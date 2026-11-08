/**
 * Coverage remainder — src/lib/service-page-metadata.ts
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadServicePageMetadata() {
  const siteSource = await readFile(join(root, "src/lib/site.ts"), "utf8");
  const metaSource = await readFile(
    join(root, "src/lib/service-page-metadata.ts"),
    "utf8",
  );
  // Drop type-only imports; rewrite the runtime site import to the sibling module.
  const rewritten = metaSource
    .replace(/import\s+type\s+\{[^}]+\}\s+from\s+["'][^"']+["'];?\s*/g, "")
    .replace(
      /import\s+\{\s*SITE_URL,\s*defaultOpenGraph\s*\}\s+from\s+["']@\/lib\/site["'];?/,
      'import { SITE_URL, defaultOpenGraph } from "./site.mjs";',
    );

  const siteOut = ts.transpileModule(siteSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "site.ts",
  }).outputText;

  const metaOut = ts.transpileModule(rewritten, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "service-page-metadata.ts",
  }).outputText;

  const dir = await mkdtemp(join(tmpdir(), "spm-"));
  await writeFile(join(dir, "site.mjs"), siteOut, "utf8");
  const outFile = join(dir, "service-page-metadata.mjs");
  await writeFile(outFile, metaOut, "utf8");
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

function sampleContent(overrides = {}) {
  return {
    path: "/web-design-victoria-bc",
    metaTitle: "Web design in Victoria, BC — EuroDigital",
    title: "Web design in Victoria, BC",
    description:
      "Professional website design for Victoria businesses with clear scope and a handoff you own.",
    ...overrides,
  };
}

test("servicePageMetadata strips a trailing brand suffix from metaTitle", async () => {
  const { mod, cleanup } = await loadServicePageMetadata();
  try {
    const metadata = mod.servicePageMetadata(sampleContent());
    assert.equal(metadata.title, "Web design in Victoria, BC");
    assert.doesNotMatch(String(metadata.title), /EuroDigital/);
  } finally {
    await cleanup();
  }
});

test("servicePageMetadata also strips a pipe-style trailing brand suffix", async () => {
  const { mod, cleanup } = await loadServicePageMetadata();
  try {
    const metadata = mod.servicePageMetadata(
      sampleContent({ metaTitle: "SEO Nanaimo | EuroDigital" }),
    );
    assert.equal(metadata.title, "SEO Nanaimo");
  } finally {
    await cleanup();
  }
});

test("servicePageMetadata leaves titles without a brand suffix unchanged", async () => {
  const { mod, cleanup } = await loadServicePageMetadata();
  try {
    const metadata = mod.servicePageMetadata(
      sampleContent({ metaTitle: "Web design in Victoria, BC" }),
    );
    assert.equal(metadata.title, "Web design in Victoria, BC");
  } finally {
    await cleanup();
  }
});

test("servicePageMetadata fills description, canonical, and social tags from content", async () => {
  const { mod, cleanup } = await loadServicePageMetadata();
  try {
    const content = sampleContent();
    const metadata = mod.servicePageMetadata(content);
    assert.equal(metadata.description, content.description);
    assert.equal(metadata.alternates.canonical, content.path);
    assert.equal(metadata.openGraph.description, content.description);
    assert.equal(
      metadata.openGraph.title,
      `${content.title} — EuroDigital`,
    );
    assert.equal(
      metadata.openGraph.url,
      `https://eurodigital.ca${content.path}`,
    );
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(
      metadata.twitter.title,
      `${content.title} — EuroDigital`,
    );
    assert.equal(metadata.twitter.description, content.description);
  } finally {
    await cleanup();
  }
});
