#!/usr/bin/env node
import path from "node:path";
import {
  finalizePagesDeployArgs,
  formatValidationReport,
  isValidDeploymentId,
  loadPagesConfig,
  parsePagesDeployArgs,
  repoRootFrom,
  requireOptionValue,
  validatePagesConfig,
} from "./pages-deployment-lib.mjs";

function parsePreflightArgs(argv) {
  const options = {
    expectedSha: null,
    rollbackDeploymentId: null,
    authorizeProductionDeploy: false,
    disableContactForm: false,
    authorizeContactFormDisable: false,
    help: false,
  };

  const list = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < list.length; i += 1) {
    const arg = list[i];
    if (arg === "--expected-sha") {
      options.expectedSha = requireOptionValue(list, i, "--expected-sha");
      i += 1;
    } else if (arg.startsWith("--expected-sha=")) {
      const value = arg.slice("--expected-sha=".length);
      if (!value.trim()) throw new Error("--expected-sha requires a value.");
      options.expectedSha = value;
    } else if (arg === "--rollback-deployment-id") {
      options.rollbackDeploymentId = requireOptionValue(
        list,
        i,
        "--rollback-deployment-id",
      );
      i += 1;
    } else if (arg.startsWith("--rollback-deployment-id=")) {
      const value = arg.slice("--rollback-deployment-id=".length);
      if (!value.trim()) {
        throw new Error("--rollback-deployment-id requires a value.");
      }
      options.rollbackDeploymentId = value;
    } else if (arg === "--authorize-production-deploy") {
      options.authorizeProductionDeploy = true;
    } else if (arg === "--disable-contact-form") {
      options.disableContactForm = true;
    } else if (arg === "--authorize-contact-form-disable") {
      options.authorizeContactFormDisable = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return finalizePagesDeployArgs({
    ...options,
    target: "production",
    dryRun: false,
    commitMessage: null,
  });
}

function usage() {
  return `Usage:
  node scripts/pages-production-preflight.mjs --expected-sha <sha> --rollback-deployment-id <uuid> --authorize-production-deploy
  node scripts/pages-production-preflight.mjs --expected-sha <sha> --rollback-deployment-id <uuid> --disable-contact-form --authorize-contact-form-disable --authorize-production-deploy

Validates committed Pages configuration and Production deploy arguments.
Does not mutate Cloudflare, Resend, DNS, or any provider setting.`;
}

async function main() {
  if (process.argv.slice(2).includes("--help") || process.argv.slice(2).includes("-h")) {
    console.log(usage());
    process.exit(0);
  }

  // Prefer shared deploy parser when callers pass --target production as well.
  const argv = process.argv.slice(2);
  const options = argv.includes("--target")
    ? parsePagesDeployArgs(argv)
    : parsePreflightArgs(argv);

  if (options.target && options.target !== "production") {
    throw new Error("Production preflight only accepts --target production.");
  }
  if (!options.expectedSha || !String(options.expectedSha).trim()) {
    throw new Error("--expected-sha is required for Production preflight.");
  }
  if (!options.authorizeProductionDeploy) {
    throw new Error(
      "--authorize-production-deploy is required for Production preflight.",
    );
  }
  if (!options.rollbackDeploymentId || !isValidDeploymentId(options.rollbackDeploymentId)) {
    throw new Error(
      "A valid operator-supplied --rollback-deployment-id is required.",
    );
  }
  if (options.disableContactForm !== options.authorizeContactFormDisable) {
    throw new Error(
      "--disable-contact-form and --authorize-contact-form-disable must be supplied together.",
    );
  }

  const root = repoRootFrom(import.meta.url);
  const config = await loadPagesConfig(path.join(root, "wrangler.jsonc"));
  const report = validatePagesConfig(config);
  console.log(
    formatValidationReport(report, "Pages production preflight (committed config)"),
  );
  if (!report.ok) process.exit(1);

  const contactFormMode = options.disableContactForm ? "disabled" : "enabled";
  console.log(`Intended contact form mode: ${contactFormMode}`);
  console.log(`Exact expected SHA: ${options.expectedSha}`);
  console.log(
    `Operator-supplied rollback deployment: ${options.rollbackDeploymentId}`,
  );
  console.log(
    `Production authorization flag present: ${options.authorizeProductionDeploy}`,
  );
  if (contactFormMode === "disabled") {
    console.log(
      "Disable authorization flag present: true (artifact will blank the public sitekey only).",
    );
  }

  const production = config.vars || {};
  console.log("Production plain-text bindings present (top-level vars):");
  for (const [name, value] of Object.entries(production)) {
    const preview =
      String(value).length > 48 ? `${String(value).slice(0, 48)}…` : value;
    console.log(`- ${name}=${preview}`);
  }
  console.log(
    "Encrypted secrets TURNSTILE_SECRET_KEY and RESEND_API_KEY must remain dashboard-managed.",
  );
  console.log(
    "Committed Production bindings are not modified by disable mode; only the generated artifact blanks NEXT_PUBLIC_TURNSTILE_SITE_KEY.",
  );
  console.log("Pages production preflight passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
