#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  formatValidationReport,
  getGitStatus,
  loadPagesConfig,
  PREVIEW_SITE_KEY,
  PRODUCTION_SITE_KEY,
  repoRootFrom,
  scanBuildAssets,
  validatePagesConfig,
} from "./pages-deployment-lib.mjs";

function parseArgs(argv) {
  const options = { target: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target") {
      options.target = argv[++i];
    } else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/pages-build.mjs --target preview
  node scripts/pages-build.mjs --target production

Builds the static export with the environment-specific public Turnstile sitekey,
then verifies assets and the committed Wrangler Pages configuration.
Does not deploy.`;
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status}`);
  }
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
  if (!configReport.ok) {
    process.exit(1);
  }

  if (options.target === "production") {
    const git = getGitStatus({ cwd: root });
    if (git.trackedDirty) {
      throw new Error(
        "Production build requires a clean tracked working tree.",
      );
    }
  }

  const siteKey =
    options.target === "preview" ? PREVIEW_SITE_KEY : PRODUCTION_SITE_KEY;
  const env = {
    ...process.env,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: siteKey,
  };

  console.log(`Building static export for ${options.target}...`);
  run("npm", ["run", "build"], env);
  run("node", ["scripts/verify-static-export.mjs"], env);

  const scan = await scanBuildAssets(path.join(root, "out"), {
    requireTestSiteKey: options.target === "preview",
    forbidTestSiteKey: options.target === "production",
    requireProductionSiteKey: options.target === "production",
    forbidProductionSiteKey: options.target === "preview",
  });

  if (!scan.ok) {
    console.error("Build asset verification failed:");
    for (const error of scan.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(
    `Pages ${options.target} build verification passed (sitekey embedded; secrets absent).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
