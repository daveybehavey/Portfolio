#!/usr/bin/env node
import path from "node:path";
import {
  formatValidationReport,
  loadPagesConfig,
  repoRootFrom,
  validatePagesConfig,
} from "./pages-deployment-lib.mjs";

async function main() {
  const root = repoRootFrom(import.meta.url);
  const config = await loadPagesConfig(path.join(root, "wrangler.jsonc"));
  const report = validatePagesConfig(config);
  console.log(
    formatValidationReport(report, "Pages production preflight (committed config)"),
  );
  if (!report.ok) process.exit(1);

  const production = config.env?.production?.vars || {};
  console.log("Production plain-text bindings present:");
  for (const [name, value] of Object.entries(production)) {
    const preview = String(value).length > 48 ? `${String(value).slice(0, 48)}…` : value;
    console.log(`- ${name}=${preview}`);
  }
  console.log(
    "Encrypted secrets TURNSTILE_SECRET_KEY and RESEND_API_KEY must remain dashboard-managed.",
  );
  console.log("Pages production preflight passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
