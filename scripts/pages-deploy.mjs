#!/usr/bin/env node
import {
  parsePagesDeployArgs,
  repoRootFrom,
  runGuardedPreviewDeploy,
  runGuardedProductionDeploy,
} from "./pages-deployment-lib.mjs";

function usage() {
  return `Usage (safe default — never invokes Wrangler):
  node scripts/pages-deploy.mjs --target preview
  node scripts/pages-deploy.mjs --target preview --dry-run
  node scripts/pages-deploy.mjs --target production --expected-sha <sha> --rollback-deployment-id <uuid> --authorize-production-deploy --dry-run

Actual Preview deployment (requires immediate authorization):
  node scripts/pages-deploy.mjs --target preview --execute-deploy --authorize-preview-deploy

Actual Production deployment (requires immediate authorization):
  node scripts/pages-deploy.mjs --target production --expected-sha <sha> --rollback-deployment-id <uuid> --authorize-production-deploy --execute-deploy

Emergency Production contact-form disable (actual):
  node scripts/pages-deploy.mjs --target production --expected-sha <sha> --rollback-deployment-id <uuid> --disable-contact-form --authorize-contact-form-disable --authorize-production-deploy --execute-deploy

Guarded Cloudflare Pages deployment. Requires committed root wrangler.jsonc.
Pages discovers wrangler.jsonc automatically from the repository root cwd —
never pass --config / -c to Wrangler Pages commands.

Non-execution is the default. A missing or dropped --dry-run flag does NOT deploy.
Actual provider execution requires --execute-deploy plus the target authorization flag.

Value-taking options (--target, --expected-sha, --commit-message, --rollback-deployment-id)
require an explicit non-empty value and must not consume another option as their value.

Do not use npm run ... -- --flag for provider-changing operations; invoke this script
with node directly so argv boundaries are preserved.`;
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
      executeDeploy: options.executeDeploy,
      authorizePreviewDeploy: options.authorizePreviewDeploy,
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
    executeDeploy: options.executeDeploy,
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
