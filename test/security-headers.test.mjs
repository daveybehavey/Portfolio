/**
 * Pins the security-header invariants declared in public/_headers.
 * Behaviour is unchanged: this only asserts the config the static export
 * already ships, including after `npm run build` copies it to out/_headers.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Headers the site already declares for all static routes (`/*`). */
const REQUIRED_GLOBAL_HEADERS = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
];

function parseHeadersBlock(text) {
  const lines = text.split(/\r?\n/);
  const global = new Map();
  let inGlobal = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "/*") {
      inGlobal = true;
      continue;
    }
    if (line.startsWith("/") && !line.startsWith("/*")) {
      inGlobal = false;
      continue;
    }
    if (!inGlobal) continue;
    const match = line.match(/^\s+([A-Za-z0-9-]+):\s*(.+)\s*$/);
    if (match) {
      global.set(match[1], match[2]);
    }
  }
  return global;
}

async function assertSecurityHeadersFile(relativePath) {
  const absolute = path.join(root, relativePath);
  const text = await readFile(absolute, "utf8");
  const headers = parseHeadersBlock(text);

  for (const [name, value] of REQUIRED_GLOBAL_HEADERS) {
    assert.equal(
      headers.get(name),
      value,
      `${relativePath} must set ${name}: ${value}`,
    );
  }
}

test("public/_headers declares the intended global security headers", async () => {
  await assertSecurityHeadersFile("public/_headers");
});

test("built out/_headers matches the public security-header invariants when present", async () => {
  const outHeaders = path.join(root, "out/_headers");
  if (!existsSync(outHeaders)) {
    // Same skip pattern as other export-artefact checks when out/ is absent.
    return;
  }
  await assertSecurityHeadersFile("out/_headers");
});
