#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  assertPreviewDeployGuards,
  assertProductionDeployGuards,
  buildWranglerDeployArgs,
  formatValidationReport,
  getGitStatus,
  loadPagesConfig,
  PREVIEW_BRANCH,
  PRODUCTION_BRANCH,
  PROJECT_NAME,
  repoRootFrom,
  ROLLBACK_DEPLOYMENT_ID,
  validatePagesConfig,
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
    }
    else if (arg === "--dry-run") options.dryRun = true;
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

  const configPath = path.join(root, "wrangler.jsonc");
  const config = await loadPagesConfig(configPath);
  const configReport = validatePagesConfig(config);
  console.log(formatValidationReport(configReport, "Pages configuration validation"));
  if (!configReport.ok) process.exit(1);

  const git = getGitStatus({ cwd: root });
  const deployBranch =
    options.target === "production" ? PRODUCTION_BRANCH : PREVIEW_BRANCH;
  const environment = options.target;

  if (options.target === "preview") {
    const guards = assertPreviewDeployGuards({
      projectName: PROJECT_NAME,
      gitBranch: git.branch,
      deployBranch,
      environment,
      productionBranch: PRODUCTION_BRANCH,
    });
    if (!guards.ok) {
      console.error("Preview deploy guards failed:");
      for (const error of guards.errors) console.error(`- ${error}`);
      process.exit(1);
    }
  } else {
    const guards = assertProductionDeployGuards({
      projectName: PROJECT_NAME,
      gitBranch: git.branch,
      deployBranch,
      environment,
      trackedDirty: git.trackedDirty,
      head: git.head,
      originMain: git.originMain,
      expectedSha: options.expectedSha,
      authorizeProductionDeploy: options.authorizeProductionDeploy,
      configOk: configReport.ok,
    });
    if (!guards.ok) {
      console.error("Production deploy guards failed:");
      for (const error of guards.errors) console.error(`- ${error}`);
      process.exit(1);
    }
  }

  const commitHash =
    options.target === "production" ? options.expectedSha : git.head;
  const commitMessage =
    options.commitMessage ||
    (options.target === "production"
      ? "EuroDigital production Pages deploy"
      : "EuroDigital contact activation preview");

  const wranglerArgs = buildWranglerDeployArgs({
    target: options.target,
    commitHash,
    commitMessage,
    commitDirty: false,
  });

  console.log(`Prepared Wrangler command: wrangler ${wranglerArgs.join(" ")}`);
  console.log(`Target environment: ${environment}`);
  console.log(`Deploy branch: ${deployBranch}`);
  console.log(`Commit hash: ${commitHash}`);
  if (options.target === "production") {
    console.log(`Rollback baseline deployment: ${ROLLBACK_DEPLOYMENT_ID}`);
  }

  if (options.dryRun) {
    console.log("Dry run complete. No Cloudflare request was made.");
    return;
  }

  const result = spawnSync("npx", ["wrangler", ...wranglerArgs], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
