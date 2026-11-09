/**
 * Coverage remainder — src/lib/blog.ts
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadBlog() {
  const source = await readFile(join(root, "src/lib/blog.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "blog.ts",
  });
  const dir = await mkdtemp(join(tmpdir(), "blog-"));
  const outFile = join(dir, "blog.mjs");
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

test("getBlogPost returns the published post for a known slug", async () => {
  const { mod, cleanup } = await loadBlog();
  try {
    const post = mod.getBlogPost("website-cost-victoria-bc");
    assert.ok(post);
    assert.equal(post.slug, "website-cost-victoria-bc");
    assert.equal(post.path, "/blog/website-cost-victoria-bc");
    assert.match(post.title, /website costs in Victoria/i);
    assert.ok(post.sections.length > 0);
  } finally {
    await cleanup();
  }
});

test("getBlogPost returns undefined for unknown and empty slugs", async () => {
  const { mod, cleanup } = await loadBlog();
  try {
    assert.equal(mod.getBlogPost("does-not-exist"), undefined);
    assert.equal(mod.getBlogPost(""), undefined);
  } finally {
    await cleanup();
  }
});

test("BLOG_PATHS matches every published post path exactly once", async () => {
  const { mod, cleanup } = await loadBlog();
  try {
    const fromPosts = mod.blogPosts.map((post) => post.path);
    assert.deepEqual(mod.BLOG_PATHS, fromPosts);
    assert.equal(new Set(mod.BLOG_PATHS).size, mod.BLOG_PATHS.length);
    for (const path of mod.BLOG_PATHS) {
      assert.match(path, /^\/blog\//);
    }
  } finally {
    await cleanup();
  }
});

test("every blog post has required metadata fields", async () => {
  const { mod, cleanup } = await loadBlog();
  try {
    assert.ok(mod.blogPosts.length >= 1);
    for (const post of mod.blogPosts) {
      assert.ok(post.slug);
      assert.equal(post.path, `/blog/${post.slug}`);
      assert.ok(post.title);
      assert.ok(post.description);
      assert.match(post.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(post.eyebrow);
      assert.ok(Array.isArray(post.sections));
      assert.ok(Array.isArray(post.relatedLinks));
    }
  } finally {
    await cleanup();
  }
});
