/**
 * Coverage for thinly covered / uncovered pure helpers in src/lib:
 * blog.getBlogPost, case-studies.getCaseStudy, why-choose structure,
 * and projects/case-study path invariants.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function transpile(relativePath, sourceText) {
  const sourcePath = join(root, relativePath);
  const source = sourceText ?? readFileSync(sourcePath, "utf8");
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;
}

function loadCjs(fileName, code, resolver) {
  const module = { exports: {} };
  const require = createRequire(pathToFileURL(fileName));
  const localRequire = (id) => {
    if (resolver) {
      const resolved = resolver(id);
      if (resolved !== undefined) return resolved;
    }
    return require(id);
  };
  // eslint-disable-next-line no-new-func
  const runner = new Function("exports", "require", "module", code);
  runner(module.exports, localRequire, module);
  return module.exports;
}

function loadBlog() {
  const path = join(root, "src/lib/blog.ts");
  return loadCjs(path, transpile("src/lib/blog.ts"));
}

function loadProjects() {
  const path = join(root, "src/lib/projects.ts");
  return loadCjs(path, transpile("src/lib/projects.ts"));
}

function loadCaseStudies() {
  const projectsPath = join(root, "src/lib/projects.ts");
  const casePath = join(root, "src/lib/case-studies.ts");
  const projectsMod = loadProjects();
  const caseSource = readFileSync(casePath, "utf8").replace(
    "@/lib/projects",
    "./projects.ts",
  );
  return loadCjs(casePath, transpile("src/lib/case-studies.ts", caseSource), (id) => {
    if (id === "./projects.ts" || id.endsWith("/projects.ts")) {
      return projectsMod;
    }
    return undefined;
  });
}

function loadWhyChoose() {
  const path = join(root, "src/lib/why-choose.ts");
  return loadCjs(path, transpile("src/lib/why-choose.ts"));
}

test("getBlogPost returns a known post by slug (success)", () => {
  const { getBlogPost, blogPosts, BLOG_PATHS } = loadBlog();
  const post = getBlogPost("website-cost-victoria-bc");
  assert.ok(post);
  assert.equal(post.path, "/blog/website-cost-victoria-bc");
  assert.equal(BLOG_PATHS.length, blogPosts.length);
  assert.ok(BLOG_PATHS.includes(post.path));
});

test("getBlogPost returns undefined for an unknown slug (empty/miss)", () => {
  const { getBlogPost } = loadBlog();
  assert.equal(getBlogPost("does-not-exist"), undefined);
  assert.equal(getBlogPost(""), undefined);
});

test("every blog post has required fields and unique slugs", () => {
  const { blogPosts } = loadBlog();
  assert.ok(blogPosts.length >= 1);
  const slugs = new Set();
  for (const post of blogPosts) {
    assert.ok(post.slug);
    assert.ok(post.path.startsWith("/blog/"));
    assert.ok(post.title);
    assert.ok(post.description);
    assert.ok(post.publishedAt);
    assert.ok(Array.isArray(post.sections));
    assert.ok(post.sections.length >= 1);
    assert.equal(slugs.has(post.slug), false);
    slugs.add(post.slug);
  }
});

test("getCaseStudy returns known studies (success)", () => {
  const { getCaseStudy, CASE_STUDY_PATHS } = loadCaseStudies();
  const maestros = getCaseStudy("maestrosservices");
  assert.equal(maestros.path, "/projects/maestrosservices");
  assert.equal(getCaseStudy("starmapco").path, "/projects/starmapco");
  assert.deepEqual(CASE_STUDY_PATHS, [
    "/projects/maestrosservices",
    "/projects/starmapco",
  ]);
});

test("getCaseStudy throws for an unknown slug (error)", () => {
  const { getCaseStudy } = loadCaseStudies();
  assert.throws(() => getCaseStudy("unknown"), /Unknown case study/);
});

test("projects list keeps featured and case-study path integrity", () => {
  const { projects } = loadProjects();
  assert.ok(projects.length >= 4);
  const withCaseStudy = projects.filter((p) => p.caseStudyPath);
  assert.ok(withCaseStudy.length >= 2);
  for (const project of projects) {
    assert.ok(project.name);
    assert.ok(project.imageSrc.startsWith("/projects/"));
    assert.ok(project.url.startsWith("https://"));
    if (project.caseStudyPath) {
      assert.match(project.caseStudyPath, /^\/projects\//);
    }
  }
});

test("why-choose content exposes intro, highlight, and six points", () => {
  const {
    WHY_CHOOSE_INTRO,
    WHY_CHOOSE_HIGHLIGHT,
    WHY_CHOOSE_POINTS,
  } = loadWhyChoose();
  assert.ok(typeof WHY_CHOOSE_INTRO === "string" && WHY_CHOOSE_INTRO.length > 20);
  assert.ok(WHY_CHOOSE_HIGHLIGHT.headline);
  assert.ok(WHY_CHOOSE_HIGHLIGHT.body);
  assert.equal(WHY_CHOOSE_HIGHLIGHT.bullets.length, 4);
  assert.equal(WHY_CHOOSE_POINTS.length, 6);
  for (const point of WHY_CHOOSE_POINTS) {
    assert.ok(point.title);
    assert.ok(point.body);
  }
});
