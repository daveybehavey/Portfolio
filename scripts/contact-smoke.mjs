#!/usr/bin/env node
import { runSmokeChecks } from "./contact-activation-lib.mjs";

function usage() {
  return [
    "Usage:",
    "  npm run contact:smoke -- --url https://approved-preview.example --allow-host approved-preview.example",
    "  npm run contact:smoke -- --url http://127.0.0.1:8788 --allow-host 127.0.0.1:8788",
    "",
    "The smoke test sends only deliberately invalid requests and cannot deliver email.",
  ].join("\n");
}

function parseArgs(argv) {
  const options = { allowedHosts: [], timeoutMs: 8_000 };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--url") {
      options.target = argv[++index];
      continue;
    }
    if (argument === "--allow-host") {
      options.allowedHosts.push(argv[++index]);
      continue;
    }
    if (argument === "--timeout-ms") {
      options.timeoutMs = Number(argv[++index]);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.target) throw new Error("--url is required.");
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1_000 || options.timeoutMs > 30_000) {
    throw new Error("--timeout-ms must be between 1000 and 30000.");
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    process.exit(0);
  }
  const report = await runSmokeChecks(options);
  console.log(`Contact endpoint smoke checks passed: ${report.endpoint}`);
  for (const result of report.results) {
    console.log(`PASS ${result.name}: ${result.status}/${result.code}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(usage());
  process.exitCode = 1;
}
