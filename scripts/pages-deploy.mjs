#!/usr/bin/env node
import {
  parsePagesDeployArgs,
  repoRootFrom,
  runGuardedPreviewDeploy,
  runGuardedProductionDeploy,
} from "./pages-deployment-lib.mjs";

function usage() {
  return `Usage:
  node scripts/pages-deploy.mjs --target preview [--dry-run]
  node scripts/pages-deploy.mjs --target production --expected-sha <sha> --rollback-deployment-id <uuid> --authorize-production-deploy [--dry-run]
  node scripts/pages-deploy.mjs --target production --expected-sha <sha> --rollback-deployment-id <uuid> --disable-contact-form --authorize-contact-form-disable --authorize-production-deploy [--dry-run]

Guarded Cloudflare Pages deployment. Requires the committed wrangler.jsonc.
Preview and Production deploys always create and verify their own artifact before Wrangler.
Does not invent provider mutations beyond the requested Wrangler deploy.

Value-taking options (--target, --expected-sha, --commit-message, --rollback-deployment-id)
require an explicit non-empty value and must not consume another option as their value.

Production requires an operator-supplied --rollback-deployment-id (current Production
deployment UUID) with no source-code default. Capture it from Cloudflare immediately
before the run; do not reuse a stale hardcoded baseline.

Emergency contact-form disable mode blanks NEXT_PUBLIC_TURNSTILE_SITE_KEY only for the
generated artifact. Committed Production wrangler.jsonc bindings are not modified.
Disable mode requires both --disable-contact-form and --authorize-contact-form-disable.`;
}

async function main() {
  // Parse before any repository, Git, build, or Wrangler work.
  const options = parsePagesDeployArgs(process.argv.slice(2));
  if (options.help || !options.target) {
    console.log(usage());
    process.exit(options.help ? 0 : 1);
  }
  if (!["preview", "production"].includes(options.target)) {
    throw new Error('--target must be "preview" or "production".');
  }

  const root = repoRootFrom(import.meta.url);
  process.chdir(root);

  if (options.target === "preview") {
    const result = await runGuardedPreviewDeploy({
      root,
      dryRun: options.dryRun,
      commitMessage: options.commitMessage,
    });
    if (!result.ok) {
      console.error(`Preview deploy failed at stage: ${result.stage}`);
      for (const error of result.errors || []) console.error(`- ${error}`);
      process.exit(1);
    }
    return;
  }

  const result = await runGuardedProductionDeploy({
    root,
    expectedSha: options.expectedSha,
    authorizeProductionDeploy: options.authorizeProductionDeploy,
    dryRun: options.dryRun,
    commitMessage: options.commitMessage,
    rollbackDeploymentId: options.rollbackDeploymentId,
    disableContactForm: options.disableContactForm,
    authorizeContactFormDisable: options.authorizeContactFormDisable,
  });

  if (!result.ok) {
    console.error(`Production deploy failed at stage: ${result.stage}`);
    for (const error of result.errors || []) console.error(`- ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
