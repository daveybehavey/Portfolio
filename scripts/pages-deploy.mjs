#!/usr/bin/env node
import {
  parsePagesDeployArgs,
  repoRootFrom,
  ROLLBACK_DEPLOYMENT_ID,
  runGuardedPreviewDeploy,
  runGuardedProductionDeploy,
} from "./pages-deployment-lib.mjs";

function usage() {
  return `Usage:
  node scripts/pages-deploy.mjs --target preview [--dry-run]
  node scripts/pages-deploy.mjs --target production --expected-sha <sha> --authorize-production-deploy [--dry-run]

Guarded Cloudflare Pages deployment. Requires the committed wrangler.jsonc.
Preview and Production deploys always create and verify their own artifact before Wrangler.
Does not invent provider mutations beyond the requested Wrangler deploy.

Value-taking options (--target, --expected-sha, --commit-message) require an explicit
non-empty value and must not consume another option as their value.

Production still requires an explicit one-time authorization flag.
Rollback deployment ID (current production baseline): ${ROLLBACK_DEPLOYMENT_ID}`;
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
