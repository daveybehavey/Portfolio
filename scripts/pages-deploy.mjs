#!/usr/bin/env node
import {
  repoRootFrom,
  ROLLBACK_DEPLOYMENT_ID,
  runGuardedPreviewDeploy,
  runGuardedProductionDeploy,
} from "./pages-deployment-lib.mjs";

function parseArgs(argv) {
  const options = {
    target: null,
    dryRun: false,
    expectedSha: null,
    authorizeProductionDeploy: false,
    commitMessage: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target") options.target = argv[++i];
    else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--expected-sha") options.expectedSha = argv[++i];
    else if (arg.startsWith("--expected-sha=")) {
      options.expectedSha = arg.slice("--expected-sha=".length);
    } else if (arg === "--authorize-production-deploy") {
      options.authorizeProductionDeploy = true;
    } else if (arg === "--commit-message") options.commitMessage = argv[++i];
    else if (arg.startsWith("--commit-message=")) {
      options.commitMessage = arg.slice("--commit-message=".length);
    } else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/pages-deploy.mjs --target preview [--dry-run]
  node scripts/pages-deploy.mjs --target production --expected-sha <sha> --authorize-production-deploy [--dry-run]

Guarded Cloudflare Pages deployment. Requires the committed wrangler.jsonc.
Preview and Production deploys always create and verify their own artifact before Wrangler.
Does not invent provider mutations beyond the requested Wrangler deploy.

Production still requires an explicit one-time authorization flag.
Rollback deployment ID (current production baseline): ${ROLLBACK_DEPLOYMENT_ID}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
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
