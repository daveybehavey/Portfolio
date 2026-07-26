import { readFile } from "node:fs/promises";

export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET_KEY =
  "1x0000000000000000000000000000000AA";

const TURNSTILE_TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);

const TURNSTILE_TEST_SECRET_KEYS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

const REQUIRED_NAMES = [
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "CONTACT_ALLOWED_ORIGINS",
];

const PLACEHOLDER_PATTERN =
  /^(?:your[_-].*|replace[_-]?me.*|change[_-]?me.*|example(?:[_-].*)?|placeholder(?:[_-].*)?|<[^>]+>)$/i;

function check(name, status, message) {
  return { name, status, message };
}

export function parseDotEnv(source) {
  const values = {};
  for (const [index, rawLine] of String(source).split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      throw new Error(`Invalid dotenv entry on line ${index + 1}.`);
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') {
        value = value
          .replaceAll("\\n", "\n")
          .replaceAll("\\r", "\r")
          .replaceAll("\\t", "\t")
          .replaceAll('\\"', '"')
          .replaceAll("\\\\", "\\");
      }
    } else {
      const commentIndex = value.search(/\s+#/);
      if (commentIndex >= 0) value = value.slice(0, commentIndex).trimEnd();
    }
    values[key] = value;
  }
  return values;
}

export async function loadEnvironmentFiles(paths) {
  const merged = {};
  for (const path of paths) {
    const source = await readFile(path, "utf8");
    Object.assign(merged, parseDotEnv(source));
  }
  return merged;
}

function isPlaceholder(value) {
  const normalized = String(value || "").trim();
  return !normalized || PLACEHOLDER_PATTERN.test(normalized);
}

function extractEmail(value) {
  const normalized = String(value || "").trim();
  if (/\r|\n/.test(normalized)) return "";
  const angle = normalized.match(/<([^<>]+)>$/);
  return (angle ? angle[1] : normalized).trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function parseOriginList(value) {
  const origins = [];
  const errors = [];
  for (const entry of String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    try {
      const url = new URL(entry);
      const canonical = url.origin;
      const isOriginOnly =
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash &&
        (entry === canonical || entry === `${canonical}/`);
      if (!isOriginOnly || !["http:", "https:"].includes(url.protocol)) {
        errors.push("Each entry must be an exact HTTP(S) origin without a path, query, or credentials.");
        continue;
      }
      origins.push(url);
    } catch {
      errors.push("Every allowed origin must be a valid URL origin.");
    }
  }
  return { origins, errors };
}

function parseHostnameList(value) {
  const hostnames = [];
  const errors = [];
  for (const entry of String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)) {
    if (
      entry.includes("://") ||
      entry.includes("/") ||
      entry.includes("*") ||
      entry.includes("@") ||
      entry.includes(":")
    ) {
      errors.push("Expected plain hostnames without protocols, ports, paths, or wildcards.");
      continue;
    }
    try {
      const hostname = new URL(`https://${entry}`).hostname.toLowerCase();
      if (hostname !== entry) {
        errors.push("Expected canonical lowercase hostnames.");
        continue;
      }
      hostnames.push(hostname);
    } catch {
      errors.push("Every Turnstile hostname must be valid.");
    }
  }
  return { hostnames, errors };
}

function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export function validateActivationConfig(environment, options = {}) {
  const mode = options.mode ?? "test";
  if (!new Set(["test", "production"]).has(mode)) {
    throw new Error('Mode must be "test" or "production".');
  }

  const env = Object.fromEntries(
    Object.entries(environment || {}).map(([key, value]) => [key, String(value ?? "").trim()]),
  );
  const checks = [];

  for (const name of REQUIRED_NAMES) {
    checks.push(
      isPlaceholder(env[name])
        ? check(name, "fail", "Required value is missing or still a placeholder.")
        : check(name, "pass", "Required value is present."),
    );
  }

  const publicKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const secretKey = env.TURNSTILE_SECRET_KEY || "";
  const publicIsTest = TURNSTILE_TEST_SITE_KEYS.has(publicKey);
  const secretIsTest = TURNSTILE_TEST_SECRET_KEYS.has(secretKey);

  if (publicKey && secretKey) {
    if (mode === "test") {
      checks.push(
        publicKey === TURNSTILE_TEST_SITE_KEY && secretKey === TURNSTILE_TEST_SECRET_KEY
          ? check("TURNSTILE_TEST_PAIR", "pass", "Official always-pass Turnstile test credentials are selected.")
          : check("TURNSTILE_TEST_PAIR", "fail", "Test mode requires Cloudflare's official always-pass sitekey and secret-key pair."),
      );
    } else {
      checks.push(
        publicIsTest || secretIsTest
          ? check("TURNSTILE_PRODUCTION_PAIR", "fail", "Production mode rejects every documented Turnstile test credential.")
          : check("TURNSTILE_PRODUCTION_PAIR", "pass", "Turnstile credentials are not documented test credentials."),
      );
    }
  }

  const resendKey = env.RESEND_API_KEY || "";
  if (resendKey) {
    checks.push(
      /^re_[A-Za-z0-9_-]{8,}$/.test(resendKey)
        ? check("RESEND_API_KEY_FORMAT", "pass", "Resend API key format is plausible.")
        : check("RESEND_API_KEY_FORMAT", "fail", "Resend API key format is not plausible."),
    );
  }

  const fromEmail = extractEmail(env.CONTACT_FROM_EMAIL);
  const toEmail = extractEmail(env.CONTACT_TO_EMAIL);
  if (env.CONTACT_FROM_EMAIL) {
    checks.push(
      isEmail(fromEmail)
        ? check("CONTACT_FROM_EMAIL_FORMAT", "pass", "Sender mailbox format is valid.")
        : check("CONTACT_FROM_EMAIL_FORMAT", "fail", "Sender must contain one valid mailbox and no line breaks."),
    );
  }
  if (env.CONTACT_TO_EMAIL) {
    checks.push(
      isEmail(toEmail)
        ? check("CONTACT_TO_EMAIL_FORMAT", "pass", "Recipient mailbox format is valid.")
        : check("CONTACT_TO_EMAIL_FORMAT", "fail", "Recipient must be one valid mailbox."),
    );
  }

  if (mode === "test" && toEmail) {
    checks.push(
      toEmail === "delivered@resend.dev"
        ? check("TEST_RECIPIENT", "pass", "Resend's non-inbox delivered test address is selected.")
        : check("TEST_RECIPIENT", "fail", "Test mode requires delivered@resend.dev to avoid sending a real message."),
    );
  }

  if (mode === "production") {
    if (toEmail) {
      checks.push(
        toEmail === "contact@eurodigital.ca"
          ? check("PRODUCTION_RECIPIENT", "pass", "Production recipient matches the reviewed project mailbox.")
          : check("PRODUCTION_RECIPIENT", "fail", "Production recipient must be contact@eurodigital.ca."),
      );
    }
    if (fromEmail) {
      checks.push(
        !fromEmail.endsWith("@resend.dev")
          ? check("PRODUCTION_SENDER", "pass", "Production sender is not a Resend testing domain.")
          : check("PRODUCTION_SENDER", "fail", "Production sender must use a verified project-controlled domain."),
      );
    }
  }

  const parsedOrigins = parseOriginList(env.CONTACT_ALLOWED_ORIGINS);
  if (env.CONTACT_ALLOWED_ORIGINS) {
    checks.push(
      parsedOrigins.errors.length === 0 && parsedOrigins.origins.length > 0
        ? check("CONTACT_ALLOWED_ORIGINS_FORMAT", "pass", "Allowed origins are exact HTTP(S) origins.")
        : check("CONTACT_ALLOWED_ORIGINS_FORMAT", "fail", parsedOrigins.errors[0] || "At least one allowed origin is required."),
    );
  }

  if (mode === "production" && parsedOrigins.origins.length > 0) {
    const unsafe = parsedOrigins.origins.some(
      (origin) => origin.protocol !== "https:" || isLocalHostname(origin.hostname),
    );
    checks.push(
      unsafe
        ? check("PRODUCTION_ORIGINS", "fail", "Production origins must use HTTPS and cannot be local hosts.")
        : check("PRODUCTION_ORIGINS", "pass", "Production origins use HTTPS and are non-local."),
    );
  }

  const parsedHostnames = parseHostnameList(env.TURNSTILE_ALLOWED_HOSTNAMES);
  if (env.TURNSTILE_ALLOWED_HOSTNAMES) {
    checks.push(
      parsedHostnames.errors.length === 0 && parsedHostnames.hostnames.length > 0
        ? check("TURNSTILE_ALLOWED_HOSTNAMES_FORMAT", "pass", "Turnstile hostnames are plain exact hostnames.")
        : check("TURNSTILE_ALLOWED_HOSTNAMES_FORMAT", "fail", parsedHostnames.errors[0] || "At least one Turnstile hostname is required."),
    );
  } else if (parsedOrigins.origins.length > 0) {
    checks.push(
      check("TURNSTILE_ALLOWED_HOSTNAMES_DERIVED", "pass", "Turnstile hostnames will be derived from allowed origins."),
    );
  }

  if (parsedHostnames.hostnames.length > 0 && parsedOrigins.origins.length > 0) {
    const missingHosts = parsedOrigins.origins
      .map((origin) => origin.hostname.toLowerCase())
      .filter((hostname) => !parsedHostnames.hostnames.includes(hostname));
    checks.push(
      missingHosts.length === 0
        ? check("ORIGIN_HOSTNAME_ALIGNMENT", "pass", "Every allowed-origin hostname is accepted by Turnstile validation.")
        : check("ORIGIN_HOSTNAME_ALIGNMENT", "fail", "Every allowed-origin hostname must also appear in TURNSTILE_ALLOWED_HOSTNAMES."),
    );
  }

  const failures = checks.filter((item) => item.status === "fail");
  const warnings = checks.filter((item) => item.status === "warn");
  return {
    ok: failures.length === 0,
    mode,
    checks,
    summary: {
      passed: checks.filter((item) => item.status === "pass").length,
      warnings: warnings.length,
      failed: failures.length,
    },
  };
}

export function formatPreflightReport(report) {
  const lines = [`Contact activation preflight (${report.mode})`];
  for (const item of report.checks) {
    lines.push(`${item.status.toUpperCase()} ${item.name}: ${item.message}`);
  }
  lines.push(
    `Summary: ${report.summary.passed} passed, ${report.summary.warnings} warnings, ${report.summary.failed} failed.`,
  );
  return lines.join("\n");
}

function isLoopbackHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function validateSmokeTarget(target, allowedHosts) {
  let url;
  try {
    url = new URL(target);
  } catch {
    return { ok: false, error: "Target URL is invalid." };
  }

  if (url.username || url.password || url.search || url.hash) {
    return { ok: false, error: "Target URL cannot contain credentials, a query, or a fragment." };
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: "Target URL must use HTTP or HTTPS." };
  }
  if (url.protocol === "http:" && !isLoopbackHostname(url.hostname)) {
    return { ok: false, error: "Remote smoke targets must use HTTPS." };
  }

  const allowlist = new Set((allowedHosts || []).map((host) => String(host).trim().toLowerCase()).filter(Boolean));
  if (allowlist.size === 0) {
    return { ok: false, error: "At least one explicit --allow-host value is required." };
  }
  if (!allowlist.has(url.host.toLowerCase())) {
    return { ok: false, error: "Target host is not explicitly allowlisted." };
  }

  return {
    ok: true,
    baseUrl: new URL(url.origin),
    endpoint: new URL("/api/contact", url.origin),
  };
}

function assertHeader(response, name, predicate, description) {
  const value = response.headers.get(name) || "";
  if (!predicate(value)) {
    throw new Error(`${description} (${name}).`);
  }
}

async function readCode(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Endpoint response was not valid JSON.");
  }
  return typeof body?.code === "string" ? body.code : "";
}

export async function runSmokeChecks({ target, allowedHosts, fetchImpl = fetch, timeoutMs = 8_000 }) {
  const validated = validateSmokeTarget(target, allowedHosts);
  if (!validated.ok) throw new Error(validated.error);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requests = [
    {
      name: "method rejection",
      expectedStatus: 405,
      expectedCode: "method_not_allowed",
      init: { method: "GET" },
    },
    {
      name: "origin rejection",
      expectedStatus: 403,
      expectedCode: "origin_not_allowed",
      init: {
        method: "POST",
        headers: { Origin: "https://invalid.example", "Content-Type": "application/json" },
        body: "{}",
      },
    },
    {
      name: "content-type enforcement",
      expectedStatus: 415,
      expectedCode: "unsupported_media_type",
      init: {
        method: "POST",
        headers: { Origin: validated.baseUrl.origin, "Content-Type": "text/plain" },
        body: "not-json",
      },
    },
    {
      name: "malformed JSON rejection",
      expectedStatus: 400,
      expectedCode: "invalid_json",
      init: {
        method: "POST",
        headers: { Origin: validated.baseUrl.origin, "Content-Type": "application/json" },
        body: "{",
      },
    },
    {
      name: "field validation",
      expectedStatus: 422,
      expectedCode: "validation_failed",
      init: {
        method: "POST",
        headers: { Origin: validated.baseUrl.origin, "Content-Type": "application/json" },
        body: "{}",
      },
    },
  ];

  const results = [];
  try {
    for (const item of requests) {
      const response = await fetchImpl(validated.endpoint, {
        ...item.init,
        redirect: "error",
        signal: controller.signal,
      });
      const code = await readCode(response);
      if (response.status !== item.expectedStatus || code !== item.expectedCode) {
        throw new Error(
          `${item.name} returned status ${response.status} and code ${code || "(missing)"}; expected ${item.expectedStatus}/${item.expectedCode}.`,
        );
      }
      assertHeader(
        response,
        "cache-control",
        (value) => /(?:^|,)\s*no-store\b/i.test(value),
        `${item.name} must disable caching`,
      );
      assertHeader(
        response,
        "x-content-type-options",
        (value) => value.toLowerCase() === "nosniff",
        `${item.name} must set nosniff`,
      );
      assertHeader(
        response,
        "content-type",
        (value) => value.toLowerCase().includes("application/json"),
        `${item.name} must return JSON`,
      );
      results.push({ name: item.name, status: response.status, code });
    }
  } finally {
    clearTimeout(timeout);
  }

  return { ok: true, endpoint: validated.endpoint.toString(), results };
}
