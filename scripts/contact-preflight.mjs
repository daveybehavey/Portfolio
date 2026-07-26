#!/usr/bin/env node
import {
  formatPreflightReport,
  loadEnvironmentFiles,
  validateActivationConfig,
} from "./contact-activation-lib.mjs";

function usage() {
  return [
    "Usage:",
    "  npm run contact:preflight -- --mode test --env-file .env.local --env-file .dev.vars",
    "  npm run contact:preflight -- --mode production --env-file production.env",
    "",
    "Values are validated but never printed.",
  ].join("\n");
}

function parseArgs(argv) {
  const options = { mode: "test", envFiles: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--mode") {
      options.mode = argv[++index];
      continue;
    }
    if (argument === "--env-file") {
      options.envFiles.push(argv[++index]);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    process.exit(0);
  }
  const environment = options.envFiles.length
    ? await loadEnvironmentFiles(options.envFiles)
    : process.env;
  const report = validateActivationConfig(environment, { mode: options.mode });
  console.log(formatPreflightReport(report));
  process.exitCode = report.ok ? 0 : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(usage());
  process.exitCode = 1;
}
