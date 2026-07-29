import { execFileSync, spawnSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseJsoncDocument } from "jsonc-parser";

export const PROJECT_NAME = "eurodigital-ca";
export const OUTPUT_DIR = "./out";
export const PRODUCTION_BRANCH = "main";
export const PREVIEW_BRANCH = "contact-preview";
export const COMPATIBILITY_DATE = "2026-04-25";
export const ROLLBACK_DEPLOYMENT_ID = "f0ddd72c-3740-4340-a9f7-4e98b63cf807";
export const CONTACT_FUNCTION_ROUTE = "/api/contact";
export const DEFAULT_PREVIEW_COMMIT_MESSAGE =
  "EuroDigital contact activation preview";
export const DEFAULT_PRODUCTION_COMMIT_MESSAGE =
  "EuroDigital production Pages deploy";

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

/** Parse Wrangler JSONC with comments and trailing commas. */
export function parseJsonc(source) {
  const errors = [];
  const result = parseJsoncDocument(String(source), errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });
  if (errors.length > 0) {
    throw new Error("Invalid Wrangler JSONC configuration.");
  }
  return result;
}

export async function loadPagesConfig(configPath) {
  const source = await readFile(configPath, "utf8");
  return parseJsonc(source);
}

/**
 * Read the next argv entry for a value-taking option.
 * Rejects missing values and values that look like another option.
 */
export function requireOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (
    typeof value !== "string" ||
    value.trim() === "" ||
    value.startsWith("-")
  ) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

/**
 * Pure Pages deploy CLI parser. Fail-closed for missing/flag-shaped option values.
 * Call before any repository, Git, build, or Wrangler work.
 */
export function parsePagesDeployArgs(argv) {
  const options = {
    target: null,
    dryRun: false,
    expectedSha: null,
    authorizeProductionDeploy: false,
    commitMessage: null,
    help: false,
  };

  const list = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < list.length; i += 1) {
    const arg = list[i];
    if (arg === "--target") {
      options.target = requireOptionValue(list, i, "--target");
      i += 1;
    } else if (arg.startsWith("--target=")) {
      const value = arg.slice("--target=".length);
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error("--target requires a value.");
      }
      options.target = value;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--expected-sha") {
      options.expectedSha = requireOptionValue(list, i, "--expected-sha");
      i += 1;
    } else if (arg.startsWith("--expected-sha=")) {
      const value = arg.slice("--expected-sha=".length);
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error("--expected-sha requires a value.");
      }
      options.expectedSha = value;
    } else if (arg === "--authorize-production-deploy") {
      options.authorizeProductionDeploy = true;
    } else if (arg === "--commit-message") {
      options.commitMessage = requireOptionValue(list, i, "--commit-message");
      i += 1;
    } else if (arg.startsWith("--commit-message=")) {
      const value = arg.slice("--commit-message=".length);
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error("--commit-message requires a value.");
      }
      options.commitMessage = value;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
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

function validatePlainTextVarsBlock(checks, label, vars, scopeLabel) {
  if (!vars || typeof vars !== "object" || Array.isArray(vars)) {
    checks.push(
      check(
        `${label}_VARS_PRESENT`,
        "fail",
        `${scopeLabel} must define the reviewed plain-text variables.`,
      ),
    );
    return false;
  }

  checks.push(
    check(
      `${label}_VARS_PRESENT`,
      "pass",
      `${scopeLabel} defines a plain-text vars object.`,
    ),
  );

  const names = Object.keys(vars);
  for (const required of PLAIN_TEXT_VAR_NAMES) {
    if (names.includes(required) && String(vars[required] || "").trim()) {
      checks.push(
        check(
          `${label}_${required}`,
          "pass",
          `${scopeLabel} defines non-empty ${required}.`,
        ),
      );
    } else {
      checks.push(
        check(
          `${label}_${required}`,
          "fail",
          `${scopeLabel} is missing required plain-text variable ${required}.`,
        ),
      );
    }
  }

  for (const secretName of SECRET_BINDING_NAMES) {
    if (Object.prototype.hasOwnProperty.call(vars, secretName)) {
      checks.push(
        check(
          `${label}_NO_SECRET_${secretName}`,
          "fail",
          `${secretName} must not be committed under ${scopeLabel}.`,
        ),
      );
    } else {
      checks.push(
        check(
          `${label}_NO_SECRET_${secretName}`,
          "pass",
          `${secretName} is not committed under ${scopeLabel}.`,
        ),
      );
    }
  }

  const unexpected = names.filter(
    (name) => !PLAIN_TEXT_VAR_NAMES.includes(name),
  );
  if (unexpected.length === 0) {
    checks.push(
      check(
        `${label}_VARS_ONLY_PLAINTEXT`,
        "pass",
        `${scopeLabel} only declares the reviewed plain-text variables.`,
      ),
    );
  } else {
    checks.push(
      check(
        `${label}_VARS_ONLY_PLAINTEXT`,
        "fail",
        `${scopeLabel} has unexpected vars: ${unexpected.join(", ")}.`,
      ),
    );
  }

  return true;
}

/**
 * Validate committed Pages configuration for Preview and Production plain-text vars.
 * Canonical shape: top-level `vars` = Production/local; `env.preview.vars` = Preview override.
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

  if (
    config.env &&
    Object.prototype.hasOwnProperty.call(config.env, "production")
  ) {
    fail(
      "NO_ENV_PRODUCTION",
      "env.production must not be present; Production bindings belong in top-level vars.",
    );
  } else {
    pass(
      "NO_ENV_PRODUCTION",
      "env.production is absent; Production uses top-level vars.",
    );
  }

  const productionVars = config.vars;
  const previewVars = config.env?.preview?.vars;

  if (
    (!productionVars || typeof productionVars !== "object") &&
    envVars(config, "production")
  ) {
    fail(
      "PRODUCTION_TOP_LEVEL_VARS",
      "Production values must live in top-level vars, not only under env.production.vars.",
    );
  }

  const productionPresent = validatePlainTextVarsBlock(
    checks,
    "PRODUCTION",
    productionVars,
    "top-level vars (Production/local)",
  );
  const previewPresent = validatePlainTextVarsBlock(
    checks,
    "PREVIEW",
    previewVars,
    "env.preview.vars",
  );

  const production = productionPresent ? productionVars : {};
  const preview = previewPresent ? previewVars : {};

  if (productionPresent) {
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
  }

  if (previewPresent) {
    validateEnvironmentSpecifics(checks, "preview", preview, {
      expected: PREVIEW_VARS,
      requireTestSiteKey: true,
      forbidProductionSiteKey: true,
      requireSenderMailbox: "onboarding@resend.dev",
      requireRecipientMailbox: "delivered@resend.dev",
      allowHttp: false,
      forbidLocalhost: false,
    });
  }

  if (
    preview.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    production.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    preview.NEXT_PUBLIC_TURNSTILE_SITE_KEY ===
      production.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  ) {
    fail(
      "SITEKEY_ENV_SEPARATION",
      "Preview and Production must not share the same Turnstile sitekey.",
    );
  } else if (
    preview.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    production.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  ) {
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
  const output = execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  // Preserve leading spaces required by `git status --porcelain` XY codes.
  return String(output).replace(/[\r\n]+$/, "");
}

export function parsePorcelainStatus(porcelain) {
  const trackedChanges = [];
  const untrackedFiles = [];
  for (const raw of String(porcelain || "").split(/\r?\n/)) {
    if (!raw) continue;
    if (raw.startsWith("??")) {
      untrackedFiles.push(stripPorcelainPath(raw.slice(3)));
      continue;
    }
    const pathPart = raw.length >= 3 ? raw.slice(3) : raw;
    if (pathPart.includes(" -> ")) {
      const [from, to] = pathPart.split(" -> ");
      trackedChanges.push(stripPorcelainPath(from), stripPorcelainPath(to));
    } else {
      trackedChanges.push(stripPorcelainPath(pathPart));
    }
  }
  return { trackedChanges, untrackedFiles };
}

function stripPorcelainPath(value) {
  const trimmed = String(value || "").trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
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
  const { trackedChanges, untrackedFiles } = parsePorcelainStatus(porcelain);
  const trackedDirty = trackedChanges.length > 0;
  const workingTreeDirty = trackedDirty || untrackedFiles.length > 0;
  return {
    branch,
    head,
    originMain,
    porcelain,
    trackedChanges,
    untrackedFiles,
    trackedDirty,
    workingTreeDirty,
  };
}

const FULL_COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/i;

export function isValidCommitSha(value) {
  return typeof value === "string" && FULL_COMMIT_SHA_PATTERN.test(value);
}

/**
 * Refresh the live remote-tracking ref for origin/main without pulling or mutating
 * the working tree. Uses a shell-free Git argv and GIT_TERMINAL_PROMPT=0.
 * Never logs remote URLs or credentials.
 */
export function refreshOriginMain({
  cwd,
  runProcess = defaultRunProcess,
  env = process.env,
} = {}) {
  const gitEnv = {
    ...env,
    GIT_TERMINAL_PROMPT: "0",
  };
  const runGitProcess = (args) =>
    runProcess("git", args, {
      cwd,
      env: gitEnv,
      stdio: "pipe",
    });

  const remotes = runGitProcess(["remote"]);
  if (remotes.status !== 0) {
    return { ok: false, errors: ["Unable to refresh origin/main."] };
  }
  const remoteNames = String(remotes.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!remoteNames.includes("origin")) {
    return { ok: false, errors: ["Unable to refresh origin/main."] };
  }

  const fetchResult = runGitProcess([
    "fetch",
    "--no-tags",
    "--prune",
    "origin",
    "+refs/heads/main:refs/remotes/origin/main",
  ]);
  if (fetchResult.status !== 0) {
    return { ok: false, errors: ["Unable to refresh origin/main."] };
  }

  const resolved = runGitProcess([
    "rev-parse",
    "--verify",
    "--quiet",
    "refs/remotes/origin/main^{commit}",
  ]);
  const resolvedLines = String(resolved.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
  const originMain = resolvedLines[0] || "";
  if (
    resolved.status !== 0 ||
    resolvedLines.length !== 1 ||
    !isValidCommitSha(originMain)
  ) {
    return { ok: false, errors: ["Unable to refresh origin/main."] };
  }

  return { ok: true, originMain };
}

export function resolveExecutable(command, platform = process.platform) {
  if (platform !== "win32") return command;
  if (command === "npm") return "npm.cmd";
  if (command === "npx") return "npx.cmd";
  return command;
}

/**
 * Locate the Node CLI entry that Windows npm/npx.cmd shims ultimately run.
 * Used so we can spawn without a shell while preserving exact argv boundaries.
 */
export function resolveNpmCliScript(command, options = {}) {
  const execPath = options.execPath || process.execPath;
  const nodeDir = path.dirname(execPath);
  if (command === "npm") {
    return path.join(nodeDir, "node_modules", "npm", "bin", "npm-cli.js");
  }
  if (command === "npx") {
    return path.join(nodeDir, "node_modules", "npm", "bin", "npx-cli.js");
  }
  return null;
}

/**
 * Build an exact spawn invocation without a shell so argument boundaries
 * (including spaced commit messages) are preserved on Windows.
 *
 * Windows cannot CreateProcess `.cmd` shims with `shell: false` (EINVAL), so
 * npm/npx are invoked as `node <npm|npx>-cli.js ...args` — the same target the
 * official shims use — without cmd.exe / PowerShell.
 */
export function buildProcessInvocation(command, args, options = {}) {
  const platform = options.platform ?? process.platform;
  const list = Array.isArray(args) ? [...args] : [];
  const shim = resolveExecutable(command, platform);

  if (platform === "win32" && (command === "npm" || command === "npx")) {
    const execPath = options.execPath || process.execPath;
    const cli = resolveNpmCliScript(command, { execPath });
    return {
      command: execPath,
      args: [cli, ...list],
      options: {
        cwd: options.cwd || process.cwd(),
        env: options.env || process.env,
        encoding: "utf8",
        shell: false,
        stdio: options.stdio ?? "inherit",
      },
      shim,
      resolvedVia: "node-cli",
    };
  }

  return {
    command: shim,
    args: list,
    options: {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      encoding: "utf8",
      shell: false,
      stdio: options.stdio ?? "inherit",
    },
    shim,
    resolvedVia: "direct",
  };
}

export function defaultRunProcess(command, args, options = {}) {
  const invocation = buildProcessInvocation(command, args, options);
  const result = spawnSync(
    invocation.command,
    invocation.args,
    invocation.options,
  );
  return {
    status: result.status === null ? 1 : result.status,
    signal: result.signal,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
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
    for (const testKey of TURNSTILE_TEST_SITE_KEYS) {
      if (text.includes(testKey)) {
        findings.testSiteKeyFiles.push(relative);
        break;
      }
    }
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
  let routesOk = false;
  try {
    const routesStat = await stat(routesPath);
    if (!routesStat.isFile() || routesStat.size === 0) {
      errors.push("_routes.json is missing or empty.");
    } else {
      routesOk = true;
      if (expectations.requireContactRoute !== false) {
        try {
          const routes = JSON.parse(await readFile(routesPath, "utf8"));
          const include = Array.isArray(routes?.include) ? routes.include : [];
          if (!include.includes(CONTACT_FUNCTION_ROUTE)) {
            errors.push(
              `_routes.json must include the ${CONTACT_FUNCTION_ROUTE} Function route.`,
            );
          }
        } catch {
          errors.push("_routes.json is not valid JSON.");
        }
      }
    }
  } catch {
    errors.push("_routes.json is missing from the build output.");
  }

  return { ok: errors.length === 0, errors, findings, routesOk };
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
  const workingTreeDirty =
    typeof input.workingTreeDirty === "boolean"
      ? input.workingTreeDirty
      : Boolean(input.trackedDirty);
  if (workingTreeDirty) {
    errors.push(
      "Working tree must be clean (no tracked changes or non-ignored untracked files).",
    );
  }
  if (input.expectedHead && input.head !== input.expectedHead) {
    errors.push("Git HEAD must remain unchanged during the Preview deploy.");
  }
  if (input.configOk === false) {
    errors.push("Committed Pages configuration validation must pass.");
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
  const workingTreeDirty =
    typeof input.workingTreeDirty === "boolean"
      ? input.workingTreeDirty
      : Boolean(input.trackedDirty);
  if (workingTreeDirty) {
    errors.push(
      "Working tree must be clean (no tracked changes or non-ignored untracked files).",
    );
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

export function productionScanExpectations() {
  return {
    requireTestSiteKey: false,
    forbidTestSiteKey: true,
    requireProductionSiteKey: true,
    forbidProductionSiteKey: false,
    requireContactRoute: true,
  };
}

export function previewScanExpectations() {
  return {
    requireTestSiteKey: true,
    forbidTestSiteKey: false,
    requireProductionSiteKey: false,
    forbidProductionSiteKey: true,
    requireContactRoute: true,
  };
}

/**
 * Build and verify the Pages static export for preview or production.
 * Shared by pages-build.mjs and the production deploy flow.
 */
export async function buildPagesStaticExport({
  target,
  root,
  runProcess = defaultRunProcess,
  getStatus = getGitStatus,
  loadConfig = loadPagesConfig,
  validateConfig = validatePagesConfig,
  scanAssets = scanBuildAssets,
  skipConfigValidation = false,
  requireCleanWorkingTree = target === "production",
  log = console.log,
}) {
  if (!["preview", "production"].includes(target)) {
    return {
      ok: false,
      errors: ['target must be "preview" or "production".'],
    };
  }

  if (!skipConfigValidation) {
    const config = await loadConfig(path.join(root, "wrangler.jsonc"));
    const configReport = validateConfig(config);
    log(formatValidationReport(configReport, "Pages configuration validation"));
    if (!configReport.ok) {
      return { ok: false, errors: ["Committed Pages configuration validation failed."] };
    }
  }

  if (requireCleanWorkingTree) {
    const git = getStatus({ cwd: root });
    if (git.workingTreeDirty) {
      return {
        ok: false,
        errors: [
          "Build requires a clean working tree (no tracked changes or non-ignored untracked files).",
        ],
      };
    }
  }

  const siteKey = target === "preview" ? PREVIEW_SITE_KEY : PRODUCTION_SITE_KEY;
  const env = {
    ...process.env,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: siteKey,
  };

  log(`Building static export for ${target}...`);
  const buildResult = runProcess("npm", ["run", "build"], {
    cwd: root,
    env,
  });
  if (buildResult.status !== 0) {
    return {
      ok: false,
      errors: [`npm run build failed with exit ${buildResult.status}.`],
    };
  }

  const verifyResult = runProcess(
    "node",
    ["scripts/verify-static-export.mjs"],
    { cwd: root, env },
  );
  if (verifyResult.status !== 0) {
    return {
      ok: false,
      errors: [
        `verify-static-export failed with exit ${verifyResult.status}.`,
      ],
    };
  }

  const expectations =
    target === "preview"
      ? previewScanExpectations()
      : productionScanExpectations();
  const scan = await scanAssets(path.join(root, "out"), expectations);
  if (!scan.ok) {
    return { ok: false, errors: scan.errors, scan };
  }

  log(
    `Pages ${target} build verification passed (sitekey embedded; secrets absent).`,
  );
  return { ok: true, errors: [], scan };
}

/**
 * Preview deploy orchestration: git guards → build → rescan → post-build git → Wrangler.
 * Injectable runners keep regression tests free of Cloudflare/network side effects.
 */
export async function runGuardedPreviewDeploy({
  root,
  dryRun = false,
  commitMessage = DEFAULT_PREVIEW_COMMIT_MESSAGE,
  configPath,
  loadConfig = loadPagesConfig,
  validateConfig = validatePagesConfig,
  getStatus = getGitStatus,
  buildTarget = buildPagesStaticExport,
  scanAssets = scanBuildAssets,
  runProcess = defaultRunProcess,
  log = console.log,
  logError = console.error,
}) {
  const resolvedConfigPath = configPath || path.join(root, "wrangler.jsonc");
  const config = await loadConfig(resolvedConfigPath);
  const configReport = validateConfig(config);
  log(formatValidationReport(configReport, "Pages configuration validation"));
  if (!configReport.ok) {
    return {
      ok: false,
      stage: "config",
      wranglerInvoked: false,
      errors: ["Committed Pages configuration validation failed."],
    };
  }

  const initialGit = getStatus({ cwd: root });
  const initialHead = initialGit.head;
  const initialGuards = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: initialGit.branch,
    deployBranch: PREVIEW_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
    workingTreeDirty: initialGit.workingTreeDirty,
    head: initialGit.head,
    configOk: true,
  });
  if (!initialGuards.ok) {
    for (const error of initialGuards.errors) logError(`- ${error}`);
    return {
      ok: false,
      stage: "initial-git",
      wranglerInvoked: false,
      errors: initialGuards.errors,
    };
  }

  const buildResult = await buildTarget({
    target: "preview",
    root,
    runProcess,
    getStatus,
    loadConfig,
    validateConfig,
    scanAssets,
    skipConfigValidation: true,
    requireCleanWorkingTree: true,
    log,
  });
  if (!buildResult.ok) {
    for (const error of buildResult.errors || []) logError(`- ${error}`);
    return {
      ok: false,
      stage: "build",
      wranglerInvoked: false,
      errors: buildResult.errors || ["Preview build failed."],
    };
  }

  const scan = await scanAssets(
    path.join(root, "out"),
    previewScanExpectations(),
  );
  if (!scan.ok) {
    for (const error of scan.errors) logError(`- ${error}`);
    return {
      ok: false,
      stage: "scan",
      wranglerInvoked: false,
      errors: scan.errors,
    };
  }

  const postGit = getStatus({ cwd: root });
  const postGuards = assertPreviewDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: postGit.branch,
    deployBranch: PREVIEW_BRANCH,
    environment: "preview",
    productionBranch: PRODUCTION_BRANCH,
    workingTreeDirty: postGit.workingTreeDirty,
    head: postGit.head,
    expectedHead: initialHead,
    configOk: true,
  });
  if (!postGuards.ok) {
    for (const error of postGuards.errors) logError(`- ${error}`);
    return {
      ok: false,
      stage: "post-build-git",
      wranglerInvoked: false,
      errors: postGuards.errors,
    };
  }

  log("Preview artifact built and verified.");

  const wranglerArgs = buildWranglerDeployArgs({
    target: "preview",
    commitHash: initialHead,
    commitMessage,
    commitDirty: false,
  });
  log(`Prepared Wrangler command: wrangler ${wranglerArgs.join(" ")}`);
  log("Target environment: preview");
  log(`Deploy branch: ${PREVIEW_BRANCH}`);
  log(`Commit hash: ${initialHead}`);

  if (dryRun) {
    log("Dry run complete. No Cloudflare request was made.");
    return {
      ok: true,
      stage: "dry-run",
      wranglerInvoked: false,
      wranglerArgs,
      errors: [],
    };
  }

  const result = runProcess("npx", ["wrangler", ...wranglerArgs], {
    cwd: root,
    env: process.env,
  });
  if (result.status !== 0) {
    return {
      ok: false,
      stage: "wrangler",
      wranglerInvoked: true,
      wranglerArgs,
      status: result.status,
      errors: [`Wrangler exited with status ${result.status}.`],
    };
  }
  return {
    ok: true,
    stage: "wrangler",
    wranglerInvoked: true,
    wranglerArgs,
    status: result.status,
    errors: [],
  };
}

/**
 * Production deploy orchestration:
 * config → refresh origin/main → git guards → build → scan → refresh origin/main →
 * post-build git guards → Wrangler.
 * Injectable runners keep regression tests free of Cloudflare/network side effects.
 */
export async function runGuardedProductionDeploy({
  root,
  expectedSha,
  authorizeProductionDeploy = false,
  dryRun = false,
  commitMessage = DEFAULT_PRODUCTION_COMMIT_MESSAGE,
  configPath,
  loadConfig = loadPagesConfig,
  validateConfig = validatePagesConfig,
  getStatus = getGitStatus,
  refreshRemoteMain = refreshOriginMain,
  buildTarget = buildPagesStaticExport,
  scanAssets = scanBuildAssets,
  runProcess = defaultRunProcess,
  log = console.log,
  logError = console.error,
}) {
  const resolvedConfigPath = configPath || path.join(root, "wrangler.jsonc");
  const config = await loadConfig(resolvedConfigPath);
  const configReport = validateConfig(config);
  log(formatValidationReport(configReport, "Pages configuration validation"));
  if (!configReport.ok) {
    return {
      ok: false,
      stage: "config",
      wranglerInvoked: false,
      remoteRefreshCount: 0,
      errors: ["Committed Pages configuration validation failed."],
    };
  }

  const initialFetch = refreshRemoteMain({ cwd: root, runProcess });
  if (!initialFetch.ok) {
    for (const error of initialFetch.errors || []) logError(`- ${error}`);
    return {
      ok: false,
      stage: "initial-fetch",
      wranglerInvoked: false,
      remoteRefreshCount: 1,
      errors: initialFetch.errors || ["Unable to refresh origin/main."],
    };
  }

  const initialGit = getStatus({ cwd: root });
  const initialGuards = assertProductionDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: initialGit.branch,
    deployBranch: PRODUCTION_BRANCH,
    environment: "production",
    workingTreeDirty: initialGit.workingTreeDirty,
    head: initialGit.head,
    originMain: initialFetch.originMain,
    expectedSha,
    authorizeProductionDeploy,
    configOk: true,
  });
  if (!initialGuards.ok) {
    for (const error of initialGuards.errors) logError(`- ${error}`);
    return {
      ok: false,
      stage: "initial-git",
      wranglerInvoked: false,
      remoteRefreshCount: 1,
      errors: initialGuards.errors,
    };
  }

  const buildResult = await buildTarget({
    target: "production",
    root,
    runProcess,
    getStatus,
    loadConfig,
    validateConfig,
    scanAssets,
    skipConfigValidation: true,
    requireCleanWorkingTree: true,
    log,
  });
  if (!buildResult.ok) {
    for (const error of buildResult.errors || []) logError(`- ${error}`);
    return {
      ok: false,
      stage: "build",
      wranglerInvoked: false,
      remoteRefreshCount: 1,
      errors: buildResult.errors || ["Production build failed."],
    };
  }

  const scan = await scanAssets(
    path.join(root, "out"),
    productionScanExpectations(),
  );
  if (!scan.ok) {
    for (const error of scan.errors) logError(`- ${error}`);
    return {
      ok: false,
      stage: "scan",
      wranglerInvoked: false,
      remoteRefreshCount: 1,
      errors: scan.errors,
    };
  }

  const postFetch = refreshRemoteMain({ cwd: root, runProcess });
  if (!postFetch.ok) {
    for (const error of postFetch.errors || []) logError(`- ${error}`);
    return {
      ok: false,
      stage: "post-build-fetch",
      wranglerInvoked: false,
      remoteRefreshCount: 2,
      errors: postFetch.errors || ["Unable to refresh origin/main."],
    };
  }

  const postGit = getStatus({ cwd: root });
  const postGuards = assertProductionDeployGuards({
    projectName: PROJECT_NAME,
    gitBranch: postGit.branch,
    deployBranch: PRODUCTION_BRANCH,
    environment: "production",
    workingTreeDirty: postGit.workingTreeDirty,
    head: postGit.head,
    originMain: postFetch.originMain,
    expectedSha,
    authorizeProductionDeploy,
    configOk: true,
  });
  if (!postGuards.ok) {
    for (const error of postGuards.errors) logError(`- ${error}`);
    return {
      ok: false,
      stage: "post-build-git",
      wranglerInvoked: false,
      remoteRefreshCount: 2,
      errors: postGuards.errors,
    };
  }

  log("Production artifact built and verified.");

  const wranglerArgs = buildWranglerDeployArgs({
    target: "production",
    commitHash: expectedSha,
    commitMessage,
    commitDirty: false,
  });
  log(`Prepared Wrangler command: wrangler ${wranglerArgs.join(" ")}`);
  log(`Target environment: production`);
  log(`Deploy branch: ${PRODUCTION_BRANCH}`);
  log(`Commit hash: ${expectedSha}`);
  log(`Rollback baseline deployment: ${ROLLBACK_DEPLOYMENT_ID}`);

  if (dryRun) {
    log("Dry run complete. No Cloudflare request was made.");
    return {
      ok: true,
      stage: "dry-run",
      wranglerInvoked: false,
      remoteRefreshCount: 2,
      wranglerArgs,
      errors: [],
    };
  }

  const result = runProcess("npx", ["wrangler", ...wranglerArgs], {
    cwd: root,
    env: process.env,
  });
  if (result.status !== 0) {
    return {
      ok: false,
      stage: "wrangler",
      wranglerInvoked: true,
      remoteRefreshCount: 2,
      wranglerArgs,
      status: result.status,
      errors: [`Wrangler exited with status ${result.status}.`],
    };
  }
  return {
    ok: true,
    stage: "wrangler",
    wranglerInvoked: true,
    remoteRefreshCount: 2,
    wranglerArgs,
    status: result.status,
    errors: [],
  };
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
