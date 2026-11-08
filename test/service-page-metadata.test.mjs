/**
 * Unit coverage for src/lib/service-page-metadata.ts — brand-suffix stripping
 * and Metadata composition for service landing pages.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function transpileLib(relativePath) {
  const sourcePath = join(root, relativePath);
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
  const require = createRequire(pathToFileURL(sourcePath));
  // eslint-disable-next-line no-new-func
  const runner = new Function("exports", "require", "module", outputText);
  runner(module.exports, require, module);
  return module.exports;
}

// Transpile site.ts first so service-page-metadata can require it via path alias rewrite.
function loadServicePageMetadata() {
  const sitePath = join(root, "src/lib/site.ts");
  const metaPath = join(root, "src/lib/service-page-metadata.ts");
  const siteSource = readFileSync(sitePath, "utf8");
  const metaSource = readFileSync(metaPath, "utf8").replaceAll(
    "@/lib/site",
    "./site.ts",
  ).replaceAll("@/lib/service-landing-types", "./service-landing-types.ts");

  const siteOut = ts.transpileModule(siteSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: sitePath,
  }).outputText;

  const metaOut = ts.transpileModule(metaSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: metaPath,
  }).outputText;

  const require = createRequire(pathToFileURL(metaPath));
  const cache = new Map();

  function loadFromText(fileName, code) {
    if (cache.has(fileName)) return cache.get(fileName);
    const module = { exports: {} };
    const localRequire = (id) => {
      if (id === "./site.ts" || id.endsWith("/site.ts")) {
        return loadFromText(sitePath, siteOut);
      }
      if (
        id === "./service-landing-types.ts" ||
        id.endsWith("/service-landing-types.ts")
      ) {
        // Types-only module — runtime import is erased; return empty.
        return {};
      }
      return require(id);
    };
    // eslint-disable-next-line no-new-func
    const runner = new Function("exports", "require", "module", code);
    runner(module.exports, localRequire, module);
    cache.set(fileName, module.exports);
    return module.exports;
  }

  return loadFromText(metaPath, metaOut);
}

const { servicePageMetadata } = loadServicePageMetadata();

function baseContent(overrides = {}) {
  return {
    path: "/web-design-victoria-bc",
    metaTitle: "Web design in Victoria, BC — EuroDigital",
    title: "Web design in Victoria, BC",
    description: "A clear description for Victoria web design.",
    ...overrides,
  };
}

test("servicePageMetadata strips a trailing em-dash EuroDigital suffix from title", () => {
  const meta = servicePageMetadata(baseContent());
  assert.equal(meta.title, "Web design in Victoria, BC");
  assert.equal(meta.alternates.canonical, "/web-design-victoria-bc");
  assert.equal(meta.description, "A clear description for Victoria web design.");
});

test("servicePageMetadata strips a trailing pipe EuroDigital suffix from title", () => {
  const meta = servicePageMetadata(
    baseContent({ metaTitle: "SEO services | EuroDigital" }),
  );
  assert.equal(meta.title, "SEO services");
});

test("servicePageMetadata leaves titles without a brand suffix unchanged", () => {
  const meta = servicePageMetadata(
    baseContent({ metaTitle: "Plain title with no brand" }),
  );
  assert.equal(meta.title, "Plain title with no brand");
});

test("servicePageMetadata openGraph and twitter re-attach a single brand suffix via title field", () => {
  const meta = servicePageMetadata(baseContent());
  assert.equal(meta.openGraph.title, "Web design in Victoria, BC — EuroDigital");
  assert.equal(meta.twitter.title, "Web design in Victoria, BC — EuroDigital");
  assert.equal(meta.openGraph.url, "https://eurodigital.ca/web-design-victoria-bc");
  assert.equal(meta.twitter.card, "summary_large_image");
});

test("servicePageMetadata does not double-strip mid-title EuroDigital mentions", () => {
  const meta = servicePageMetadata(
    baseContent({
      metaTitle: "Why EuroDigital builds local sites — EuroDigital",
      title: "Why EuroDigital builds local sites",
    }),
  );
  assert.equal(meta.title, "Why EuroDigital builds local sites");
  assert.equal(
    meta.openGraph.title,
    "Why EuroDigital builds local sites — EuroDigital",
  );
});
