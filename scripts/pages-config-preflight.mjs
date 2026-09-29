#!/usr/bin/env node
/**
 * Config-only Pages preflight.
 * Validates committed root wrangler.jsonc and exits.
 * Never invokes Wrangler, never mutates Cloudflare/Resend/DNS, never builds.
 */
import path from "node:path";
import {
  formatValidationReport,
  loadPagesConfig,
  repoRootFrom,
  validatePagesConfig,
} from "./pages-deployment-lib.mjs";

function usage() {
  return `Usage:
  node scripts/pages-config-preflight.mjs
  npm run pages:config:preflight

Validates committed root wrangler.jsonc only.
Does not build, does not call Wrangler, and does not mutate any provider.`;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    process.exit(0);
  }
  if (argv.length > 0) {
    throw new Error(`Unknown argument: ${argv[0]}. This preflight takes no options (see --help).`);
  }

  const root = repoRootFrom(import.meta.url);
  const configPath = path.join(root, "wrangler.jsonc");
  const config = await loadPagesConfig(configPath);
  const report = validatePagesConfig(config);
  console.log(formatValidationReport(report, "Pages config preflight (committed wrangler.jsonc)"));
  if (!report.ok) process.exit(1);
  console.log("Pages config preflight passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});