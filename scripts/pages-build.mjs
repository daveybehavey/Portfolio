#!/usr/bin/env node
import {
  buildPagesStaticExport,
  repoRootFrom,
} from "./pages-deployment-lib.mjs";

function parseArgs(argv) {
  const options = {
    target: null,
    disableContactForm: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target") {
      options.target = argv[++i];
    } else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else if (arg === "--disable-contact-form") {
      options.disableContactForm = true;
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
  node scripts/pages-build.mjs --target production --disable-contact-form

Builds the static export with the environment-specific public Turnstile sitekey,
then verifies assets and the committed Wrangler Pages configuration.
Disable mode blanks NEXT_PUBLIC_TURNSTILE_SITE_KEY only for the generated artifact;
committed wrangler.jsonc Production bindings are not modified.
Does not deploy.`;
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
  if (options.disableContactForm && options.target !== "production") {
    throw new Error(
      "--disable-contact-form is only valid with --target production.",
    );
  }

  const root = repoRootFrom(import.meta.url);
  process.chdir(root);

  const result = await buildPagesStaticExport({
    target: options.target,
    root,
    contactFormMode: options.disableContactForm ? "disabled" : "enabled",
    requireCleanWorkingTree: options.target === "production",
  });
  if (!result.ok) {
    console.error("Pages build failed:");
    for (const error of result.errors || []) console.error(`- ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
