import { execFileSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_NAME = "eurodigital-ca";
export const OUTPUT_DIR = "./out";
export const PRODUCTION_BRANCH = "main";
export const PREVIEW_BRANCH = "contact-preview";
export const COMPATIBILITY_DATE = "2026-04-25";
export const ROLLBACK_DEPLOYMENT_ID = "f0ddd72c-3740-4340-a9f7-4e98b63cf807";

export const PRODUCTION_SITE_KEY = "0x4AAAAAAEAJbd2XaAk7ZRBR";
export const PREVIEW_SITE_KEY = "1x00000000000000000000AA";

export const TURNSTILE_TEST_SITE_KEYS = Object.freeze([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);

export const SECRET_BINDING_NAMES = Object.freeze([
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
]);

export const PLAIN_TEXT_VAR_NAMES = Object.freeze([
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "CONTACT_ALLOWED_ORIGINS",
  "TURNSTILE_ALLOWED_HOSTNAMES",
]);

export const PREVIEW_VARS = Object.freeze({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: PREVIEW_SITE_KEY,
  CONTACT_FROM_EMAIL: "EuroDigital Preview <onboarding@resend.dev>",
  CONTACT_TO_EMAIL: "delivered@resend.dev",
  CONTACT_ALLOWED_ORIGINS:
    "https://contact-preview.eurodigital-ca.pages.dev",
  TURNSTILE_ALLOWED_HOSTNAMES: "contact-preview.eurodigital-ca.pages.dev",
});

export const PRODUCTION_VARS = Object.freeze({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: PRODUCTION_SITE_KEY,
  CONTACT_FROM_EMAIL: "EuroDigital <website@send.eurodigital.ca>",
  CONTACT_TO_EMAIL: "contact@eurodigital.ca",
  CONTACT_ALLOWED_ORIGINS:
    "https://eurodigital.ca,https://www.eurodigital.ca",
  TURNSTILE_ALLOWED_HOSTNAMES: "eurodigital.ca,www.eurodigital.ca",
});

const RESEND_KEY_PATTERN = /\bre_[A-Za-z0-9]{10,}\b/;
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".map",
]);

export function repoRootFrom(importMetaUrl = import.meta.url) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "..");
}

/** Minimal JSONC parser for Wrangler config (// and /* comments). */
export function parseJsonc(source) {
  const withoutBlock = String(source).replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLine = withoutBlock.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutLine);
}

export async function loadPagesConfig(configPath) {
  const source = await readFile(configPath, "utf8");
  return parseJsonc(source);
}

function check(name, status, message) {
  return { name, status, message };
}

function extractMailbox(value) {
  const normalized = String(value || "").trim();
  if (/\r|\n/.test(normalized)) return "";
  const angle = normalized.match(/<([^<>]+)>$/);
  return (angle ? angle[1] : normalized).trim().toLowerCase();
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseOrigins(value) {
  return parseCsv(value).map((origin) => {
    try {
      return new URL(origin);
    } catch {
      return null;
    }
  });
}

function envVars(config, environment) {
  return config?.env?.[environment]?.vars || null;
}

/**
 * Validate committed Pages configuration for Preview and Production plain-text vars.
 */
export function validatePagesConfig(config, options = {}) {
  const checks = [];
  const fail = (name, message) => checks.push(check(name, "fail", message));
  const pass = (name, message) => checks.push(check(name, "pass", message));

  if (!config || typeof config !== "object") {
    fail("CONFIG_OBJECT", "Configuration must be a JSON object.");
    return summarize(checks);
  }

  if (config.name === PROJECT_NAME) {
    pass("PROJECT_NAME", `Project name is ${PROJECT_NAME}.`);
  } else {
    fail("PROJECT_NAME", `Expected project name ${PROJECT_NAME}.`);
  }

  const outputDir = String(config.pages_build_output_dir || "");
  if (outputDir === OUTPUT_DIR || outputDir === "out") {
    pass("OUTPUT_DIR", `Output directory is ${OUTPUT_DIR}.`);
  } else {
    fail("OUTPUT_DIR", `Expected pages_build_output_dir ${OUTPUT_DIR}.`);
  }

  const topCompat = String(config.compatibility_date || "");
  if (topCompat === COMPATIBILITY_DATE) {
    pass(
      "COMPATIBILITY_DATE",
      `Top-level compatibility_date is ${COMPATIBILITY_DATE}.`,
    );
  } else {
    fail(
      "COMPATIBILITY_DATE",
      `Expected compatibility_date ${COMPATIBILITY_DATE}.`,
    );
  }

  for (const environment of ["preview", "production"]) {
    const vars = envVars(config, environment);
    const label = environment.toUpperCase();
    if (!vars || typeof vars !== "object") {
      fail(
        `${label}_VARS_PRESENT`,
        `${environment} must define env.${environment}.vars explicitly.`,
      );
      continue;
    }

    const names = Object.keys(vars);
    for (const required of PLAIN_TEXT_VAR_NAMES) {
      if (names.includes(required) && String(vars[required] || "").trim()) {
        pass(
          `${label}_${required}`,
          `${environment} defines non-empty ${required}.`,
        );
      } else {
        fail(
          `${label}_${required}`,
          `${environment} is missing required plain-text variable ${required}.`,
        );
      }
    }

    for (const secretName of SECRET_BINDING_NAMES) {
      if (Object.prototype.hasOwnProperty.call(vars, secretName)) {
        fail(
          `${label}_NO_SECRET_${secretName}`,
          `${secretName} must not be committed under env.${environment}.vars.`,
        );
      } else {
        pass(
          `${label}_NO_SECRET_${secretName}`,
          `${secretName} is not committed for ${environment}.`,
        );
      }
    }

    const unexpected = names.filter(
      (name) => !PLAIN_TEXT_VAR_NAMES.includes(name),
    );
    if (unexpected.length === 0) {
      pass(
        `${label}_VARS_ONLY_PLAINTEXT`,
        `${environment} only declares the reviewed plain-text variables.`,
      );
    } else {
      fail(
        `${label}_VARS_ONLY_PLAINTEXT`,
        `${environment} has unexpected vars: ${unexpected.join(", ")}.`,
      );
    }
  }

  const preview = envVars(config, "preview") || {};
  const production = envVars(config, "production") || {};

  validateEnvironmentSpecifics(checks, "preview", preview, {
    expected: PREVIEW_VARS,
    requireTestSiteKey: true,
    forbidProductionSiteKey: true,
    requireSenderMailbox: "onboarding@resend.dev",
    requireRecipientMailbox: "delivered@resend.dev",
    allowHttp: false,
    forbidLocalhost: false,
  });

  validateEnvironmentSpecifics(checks, "production", production, {
    expected: PRODUCTION_VARS,
    requireTestSiteKey: false,
    forbidProductionSiteKey: false,
    requireSenderMailbox: "website@send.eurodigital.ca",
    requireRecipientMailbox: "contact@eurodigital.ca",
    allowHttp: false,
    forbidLocalhost: true,
    forbidTestCredentials: true,
  });

  if (
    preview.NEXT_PUBLIC_TURNSTILE_SITE_KEY ===
    production.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  ) {
    fail(
      "SITEKEY_ENV_SEPARATION",
      "Preview and Production must not share the same Turnstile sitekey.",
    );
  } else {
    pass(
      "SITEKEY_ENV_SEPARATION",
      "Preview and Production use distinct Turnstile sitekeys.",
    );
  }

  if (options.requireExactExpectedValues !== false) {
    for (const [key, value] of Object.entries(PREVIEW_VARS)) {
      if (preview[key] === value) {
        pass(`PREVIEW_EXACT_${key}`, `Preview ${key} matches the reviewed value.`);
      } else if (preview[key] != null) {
        fail(
          `PREVIEW_EXACT_${key}`,
          `Preview ${key} does not match the reviewed value.`,
        );
      }
    }
    for (const [key, value] of Object.entries(PRODUCTION_VARS)) {
      if (production[key] === value) {
        pass(
          `PRODUCTION_EXACT_${key}`,
          `Production ${key} matches the reviewed value.`,
        );
      } else if (production[key] != null) {
        fail(
          `PRODUCTION_EXACT_${key}`,
          `Production ${key} does not match the reviewed value.`,
        );
      }
    }
  }

  return summarize(checks);
}

function validateEnvironmentSpecifics(checks, environment, vars, rules) {
  const label = environment.toUpperCase();
  const siteKey = String(vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "");
  const fromMailbox = extractMailbox(vars.CONTACT_FROM_EMAIL);
  const toMailbox = extractMailbox(vars.CONTACT_TO_EMAIL);
  const origins = parseOrigins(vars.CONTACT_ALLOWED_ORIGINS);
  const hostnames = parseCsv(vars.TURNSTILE_ALLOWED_HOSTNAMES).map((h) =>
    h.toLowerCase(),
  );

  if (rules.requireTestSiteKey) {
    if (siteKey === PREVIEW_SITE_KEY) {
      checks.push(
        check(
          `${label}_TEST_SITEKEY`,
          "pass",
          "Uses the official always-pass Turnstile test sitekey.",
        ),
      );
    } else {
      checks.push(
        check(
          `${label}_TEST_SITEKEY`,
          "fail",
          "Preview must use the official always-pass Turnstile test sitekey.",
        ),
      );
    }
  }

  if (rules.forbidTestCredentials || rules.forbidProductionSiteKey === false) {
    const usesTest = TURNSTILE_TEST_SITE_KEYS.includes(siteKey);
    if (rules.forbidTestCredentials) {
      if (usesTest) {
        checks.push(
          check(
            `${label}_NO_TEST_SITEKEY`,
            "fail",
            "Production must not use Cloudflare Turnstile test sitekeys.",
          ),
        );
      } else {
        checks.push(
          check(
            `${label}_NO_TEST_SITEKEY`,
            "pass",
            "Production does not use Cloudflare Turnstile test sitekeys.",
          ),
        );
      }
    }
  }

  if (rules.forbidProductionSiteKey) {
    if (siteKey === PRODUCTION_SITE_KEY) {
      checks.push(
        check(
          `${label}_NO_PRODUCTION_SITEKEY`,
          "fail",
          "Preview must not embed the production Turnstile sitekey.",
        ),
      );
    } else {
      checks.push(
        check(
          `${label}_NO_PRODUCTION_SITEKEY`,
          "pass",
          "Preview does not embed the production Turnstile sitekey.",
        ),
      );
    }
  }

  if (fromMailbox === rules.requireSenderMailbox) {
    checks.push(
      check(
        `${label}_SENDER`,
        "pass",
        `Sender mailbox is ${rules.requireSenderMailbox}.`,
      ),
    );
  } else {
    checks.push(
      check(
        `${label}_SENDER`,
        "fail",
        `Sender mailbox must be ${rules.requireSenderMailbox}.`,
      ),
    );
  }

  if (toMailbox === rules.requireRecipientMailbox) {
    checks.push(
      check(
        `${label}_RECIPIENT`,
        "pass",
        `Recipient mailbox is ${rules.requireRecipientMailbox}.`,
      ),
    );
  } else {
    checks.push(
      check(
        `${label}_RECIPIENT`,
        "fail",
        `Recipient mailbox must be ${rules.requireRecipientMailbox}.`,
      ),
    );
  }

  const validOrigins = origins.filter(Boolean);
  if (validOrigins.length === 0 || validOrigins.length !== origins.length) {
    checks.push(
      check(
        `${label}_ORIGINS_FORMAT`,
        "fail",
        "Allowed origins must be exact HTTP(S) origin URLs.",
      ),
    );
  } else {
    const badScheme = validOrigins.filter((url) => {
      if (rules.allowHttp) return !["http:", "https:"].includes(url.protocol);
      return url.protocol !== "https:";
    });
    if (badScheme.length > 0) {
      checks.push(
        check(
          `${label}_ORIGINS_SCHEME`,
          "fail",
          rules.allowHttp
            ? "Origins must use http or https."
            : "Origins must use https.",
        ),
      );
    } else {
      checks.push(
        check(
          `${label}_ORIGINS_SCHEME`,
          "pass",
          "Origins use the required URL scheme.",
        ),
      );
    }
  }

  if (hostnames.some((host) => host.includes("*"))) {
    checks.push(
      check(
        `${label}_NO_WILDCARD`,
        "fail",
        "Wildcard Turnstile hostnames are not allowed.",
      ),
    );
  } else {
    checks.push(
      check(
        `${label}_NO_WILDCARD`,
        "pass",
        "No wildcard Turnstile hostnames are present.",
      ),
    );
  }

  const localhostHosts = hostnames.filter(
    (host) => host === "localhost" || host === "127.0.0.1" || host === "::1",
  );
  const localhostOrigins = validOrigins.filter(
    (url) =>
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]",
  );
  if (rules.forbidLocalhost && (localhostHosts.length || localhostOrigins.length)) {
    checks.push(
      check(
        `${label}_NO_LOCALHOST`,
        "fail",
        "Production must not include localhost origins or hostnames.",
      ),
    );
  } else if (rules.forbidLocalhost) {
    checks.push(
      check(
        `${label}_NO_LOCALHOST`,
        "pass",
        "Production does not include localhost values.",
      ),
    );
  }

  const originHosts = validOrigins.map((url) => url.hostname.toLowerCase());
  const missingHosts = originHosts.filter((host) => !hostnames.includes(host));
  if (missingHosts.length === 0 && originHosts.length > 0) {
    checks.push(
      check(
        `${label}_ORIGIN_HOSTNAME_ALIGNMENT`,
        "pass",
        "Every allowed-origin hostname is listed for Turnstile.",
      ),
    );
  } else if (originHosts.length > 0) {
    checks.push(
      check(
        `${label}_ORIGIN_HOSTNAME_ALIGNMENT`,
        "fail",
        `Turnstile hostnames missing origin hosts: ${missingHosts.join(", ")}.`,
      ),
    );
  }
}

function summarize(checks) {
  const summary = {
    passed: checks.filter((item) => item.status === "pass").length,
    failed: checks.filter((item) => item.status === "fail").length,
    warnings: checks.filter((item) => item.status === "warn").length,
  };
  return {
    ok: summary.failed === 0,
    checks,
    summary,
  };
}

export function formatValidationReport(report, title = "Pages configuration") {
  const lines = [`${title}`];
  for (const item of report.checks) {
    lines.push(
      `${item.status.toUpperCase()} ${item.name}: ${item.message}`,
    );
  }
  lines.push(
    `Summary: ${report.summary.passed} passed, ${report.summary.warnings} warnings, ${report.summary.failed} failed.`,
  );
  return lines.join("\n");
}

export function runGit(args, options = {}) {
  const cwd = options.cwd || process.cwd();
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function getGitStatus(options = {}) {
  const branch = runGit(["branch", "--show-current"], options);
  const head = runGit(["rev-parse", "HEAD"], options);
  let originMain = "";
  try {
    originMain = runGit(["rev-parse", "origin/main"], options);
  } catch {
    originMain = "";
  }
  const porcelain = runGit(["status", "--porcelain"], options);
  const trackedDirty = porcelain
    .split(/\r?\n/)
    .filter(Boolean)
    .some((line) => !line.startsWith("??"));
  return { branch, head, originMain, porcelain, trackedDirty };
}

export async function collectTextFiles(rootDir) {
  const files = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        continue;
      }
      files.push(fullPath);
    }
  }
  await walk(rootDir);
  return files;
}

export async function scanBuildAssets(outDir, expectations) {
  const absoluteOut = path.resolve(outDir);
  const files = await collectTextFiles(absoluteOut);
  const findings = {
    testSiteKeyFiles: [],
    productionSiteKeyFiles: [],
    resendKeyFiles: [],
    turnstileSecretShapedFiles: [],
  };

  for (const filePath of files) {
    let text;
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      continue;
    }
    const relative = path.relative(absoluteOut, filePath);
    if (text.includes(PREVIEW_SITE_KEY)) findings.testSiteKeyFiles.push(relative);
    if (text.includes(PRODUCTION_SITE_KEY)) {
      findings.productionSiteKeyFiles.push(relative);
    }
    if (RESEND_KEY_PATTERN.test(text)) findings.resendKeyFiles.push(relative);
    // Avoid flagging the public production sitekey as a secret; check always-pass secrets only.
    for (const secret of [
      "1x0000000000000000000000000000000AA",
      "2x0000000000000000000000000000000AA",
      "3x0000000000000000000000000000000AA",
    ]) {
      if (text.includes(secret)) {
        findings.turnstileSecretShapedFiles.push(relative);
        break;
      }
    }
  }

  const errors = [];
  if (expectations.requireTestSiteKey && findings.testSiteKeyFiles.length < 1) {
    errors.push("Built assets do not contain the official Turnstile test sitekey.");
  }
  if (
    expectations.forbidTestSiteKey &&
    findings.testSiteKeyFiles.length > 0
  ) {
    errors.push("Built assets contain a Cloudflare Turnstile test sitekey.");
  }
  if (
    expectations.requireProductionSiteKey &&
    findings.productionSiteKeyFiles.length < 1
  ) {
    errors.push("Built assets do not contain the production Turnstile sitekey.");
  }
  if (
    expectations.forbidProductionSiteKey &&
    findings.productionSiteKeyFiles.length > 0
  ) {
    errors.push("Built assets contain the production Turnstile sitekey.");
  }
  if (findings.resendKeyFiles.length > 0) {
    errors.push("Built assets contain a Resend API key pattern.");
  }
  if (findings.turnstileSecretShapedFiles.length > 0) {
    errors.push("Built assets contain a Turnstile secret test value.");
  }

  const routesPath = path.join(absoluteOut, "_routes.json");
  try {
    const routesStat = await stat(routesPath);
    if (!routesStat.isFile() || routesStat.size === 0) {
      errors.push("_routes.json is missing or empty.");
    }
  } catch {
    errors.push("_routes.json is missing from the build output.");
  }

  return { ok: errors.length === 0, errors, findings };
}

export function assertPreviewDeployGuards(input) {
  const errors = [];
  if (input.projectName !== PROJECT_NAME) {
    errors.push(`Project must be ${PROJECT_NAME}.`);
  }
  if (input.gitBranch !== PREVIEW_BRANCH) {
    errors.push(`Current git branch must be ${PREVIEW_BRANCH}.`);
  }
  if (input.deployBranch !== PREVIEW_BRANCH) {
    errors.push(`Preview deploy branch must be ${PREVIEW_BRANCH}.`);
  }
  if (input.environment !== "preview") {
    errors.push('Preview deploy environment must be "preview".');
  }
  if (input.productionBranch === PREVIEW_BRANCH) {
    errors.push("Preview branch must not be the Pages production branch.");
  }
  return { ok: errors.length === 0, errors };
}

export function assertProductionDeployGuards(input) {
  const errors = [];
  if (input.projectName !== PROJECT_NAME) {
    errors.push(`Project must be ${PROJECT_NAME}.`);
  }
  if (input.gitBranch !== PRODUCTION_BRANCH) {
    errors.push(`Current git branch must be ${PRODUCTION_BRANCH}.`);
  }
  if (input.deployBranch !== PRODUCTION_BRANCH) {
    errors.push(`Deployment branch must be ${PRODUCTION_BRANCH}.`);
  }
  if (input.environment !== "production") {
    errors.push('Production deploy environment must be "production".');
  }
  if (input.trackedDirty) {
    errors.push("Tracked working tree must be clean.");
  }
  if (!input.originMain) {
    errors.push("origin/main must be available.");
  } else if (input.head !== input.originMain) {
    errors.push("Local HEAD must equal origin/main.");
  }
  if (!input.expectedSha) {
    errors.push("An exact --expected-sha argument is required.");
  } else if (input.expectedSha !== input.head) {
    errors.push("Local HEAD must equal the provided --expected-sha.");
  }
  if (!input.authorizeProductionDeploy) {
    errors.push(
      "Missing one-time --authorize-production-deploy confirmation.",
    );
  }
  if (!input.configOk) {
    errors.push("Committed Pages configuration validation must pass.");
  }
  return { ok: errors.length === 0, errors };
}

export function buildWranglerDeployArgs({
  target,
  commitHash,
  commitMessage,
  commitDirty = false,
  configPath = "wrangler.jsonc",
}) {
  const branch = target === "production" ? PRODUCTION_BRANCH : PREVIEW_BRANCH;
  const args = [
    "pages",
    "deploy",
    "out",
    `--config=${configPath}`,
    `--project-name=${PROJECT_NAME}`,
    `--branch=${branch}`,
  ];
  if (commitHash) args.push(`--commit-hash=${commitHash}`);
  if (commitMessage) args.push(`--commit-message=${commitMessage}`);
  args.push(`--commit-dirty=${commitDirty ? "true" : "false"}`);
  return args;
}
