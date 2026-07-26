const MAX_REQUEST_BYTES = 16_384;
const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const CONTACT_ACTION = "contact";
const EXTERNAL_REQUEST_TIMEOUT_MS = 8_000;

const PROJECT_TYPES = new Map([
  ["one-page", "One-Page Launch"],
  ["business-website", "Business Website"],
  ["online-store", "Online Store"],
  ["custom", "Custom Project"],
  ["unsure", "Not sure yet"],
]);

const REQUIRED_ENV = [
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "CONTACT_ALLOWED_ORIGINS",
];

function responseHeaders(origin = "") {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}

function jsonResponse(status, body, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function getConfig(env) {
  const missing = REQUIRED_ENV.filter((key) => !String(env?.[key] || "").trim());
  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const allowedOrigins = parseCsv(env.CONTACT_ALLOWED_ORIGINS)
    .map(normalizeOrigin)
    .filter(Boolean);
  if (allowedOrigins.length === 0) {
    return { ok: false, missing: ["CONTACT_ALLOWED_ORIGINS"] };
  }

  const configuredHostnames = parseCsv(env.TURNSTILE_ALLOWED_HOSTNAMES);
  const allowedHostnames = configuredHostnames.length
    ? configuredHostnames.map((hostname) => hostname.toLowerCase())
    : allowedOrigins.map((origin) => new URL(origin).hostname.toLowerCase());

  return {
    ok: true,
    allowedOrigins,
    allowedHostnames,
    turnstileSecret: String(env.TURNSTILE_SECRET_KEY),
    resendApiKey: String(env.RESEND_API_KEY),
    fromEmail: String(env.CONTACT_FROM_EMAIL),
    toEmail: String(env.CONTACT_TO_EMAIL),
  };
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function validateContactPayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: { form: "Invalid request body." } };
  }

  const values = {
    name: cleanText(input.name),
    email: cleanText(input.email).toLowerCase(),
    business: cleanText(input.business),
    projectType: cleanText(input.projectType),
    message: cleanText(input.message),
    website: cleanText(input.website),
    turnstileToken: cleanText(input.turnstileToken),
    submissionId: cleanText(input.submissionId),
  };

  if (values.website) {
    return { ok: false, spam: true, errors: { form: "Invalid submission." } };
  }

  const errors = {};
  if (values.name.length < 2 || values.name.length > 100) {
    errors.name = "Enter a name between 2 and 100 characters.";
  }
  if (!isEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (values.business.length < 2 || values.business.length > 160) {
    errors.business = "Enter a business or industry between 2 and 160 characters.";
  }
  if (!PROJECT_TYPES.has(values.projectType)) {
    errors.projectType = "Choose the closest project type.";
  }
  if (values.message.length < 20 || values.message.length > 5_000) {
    errors.message = "Enter a message between 20 and 5,000 characters.";
  }
  if (!values.turnstileToken || values.turnstileToken.length > 2_048) {
    errors.turnstileToken = "Complete the spam-protection check.";
  }
  if (!isUuid(values.submissionId)) {
    errors.submissionId = "Refresh the page and try again.";
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, values };
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchWithTimeout(fetchImpl, url, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTERNAL_REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function safeSubjectPart(value, maxLength = 80) {
  return String(value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function buildEmailPayload(values, config) {
  const projectLabel = PROJECT_TYPES.get(values.projectType) || "Website project";
  const subject = `EuroDigital inquiry — ${safeSubjectPart(projectLabel, 40)} — ${safeSubjectPart(values.business, 60)}`;
  const rows = [
    ["Name", values.name],
    ["Email", values.email],
    ["Business", values.business],
    ["Project type", projectLabel],
    ["Submission ID", values.submissionId],
  ];

  const text = [
    "New EuroDigital website inquiry",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    values.message,
  ].join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body><h1>New EuroDigital website inquiry</h1><table>${htmlRows}</table><h2>Message</h2><p style="white-space:pre-wrap">${escapeHtml(values.message)}</p></body></html>`;

  return {
    from: config.fromEmail,
    to: [config.toEmail],
    reply_to: values.email,
    subject,
    text,
    html,
  };
}

async function readJsonBody(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "request_too_large",
      message: "The message is too large.",
    };
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "request_too_large",
      message: "The message is too large.",
    };
  }

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return {
      ok: false,
      status: 400,
      code: "invalid_json",
      message: "The request body is not valid JSON.",
    };
  }
}

async function verifyTurnstile({ token, remoteIp, config, fetchImpl }) {
  let response;
  try {
    response = await fetchWithTimeout(fetchImpl, TURNSTILE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: config.turnstileSecret,
        response: token,
        remoteip: remoteIp || undefined,
      }),
    });
  } catch {
    return { ok: false, unavailable: true };
  }

  if (!response.ok) {
    return { ok: false, unavailable: true };
  }

  let result;
  try {
    result = await response.json();
  } catch {
    return { ok: false, unavailable: true };
  }

  if (!result?.success) {
    return {
      ok: false,
      codes: Array.isArray(result?.["error-codes"]) ? result["error-codes"] : [],
    };
  }

  const hostname = cleanText(result.hostname).toLowerCase();
  if (!hostname || !config.allowedHostnames.includes(hostname)) {
    return { ok: false, codes: ["hostname-mismatch"] };
  }
  if (cleanText(result.action) !== CONTACT_ACTION) {
    return { ok: false, codes: ["action-mismatch"] };
  }

  return { ok: true };
}

async function sendEmail({ values, config, fetchImpl }) {
  const payload = buildEmailPayload(values, config);
  let response;
  try {
    response = await fetchWithTimeout(fetchImpl, RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact/${values.submissionId}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false };
  }

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  return { ok: true };
}

export async function handleContactRequest(request, env, fetchImpl = fetch) {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      ok: false,
      code: "method_not_allowed",
      message: "Method not allowed.",
    });
  }

  const config = getConfig(env);
  if (!config.ok) {
    return jsonResponse(503, {
      ok: false,
      code: "form_unavailable",
      message: "The online form is not configured. Please use the email link instead.",
    });
  }

  const origin = normalizeOrigin(request.headers.get("origin") || "");
  if (!origin || !config.allowedOrigins.includes(origin)) {
    return jsonResponse(403, {
      ok: false,
      code: "origin_not_allowed",
      message: "This request origin is not allowed.",
    });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse(
      415,
      {
        ok: false,
        code: "unsupported_media_type",
        message: "Send JSON content.",
      },
      origin,
    );
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return jsonResponse(
      parsed.status,
      { ok: false, code: parsed.code, message: parsed.message },
      origin,
    );
  }

  const validated = validateContactPayload(parsed.value);
  if (!validated.ok) {
    return jsonResponse(
      validated.spam ? 400 : 422,
      {
        ok: false,
        code: validated.spam ? "invalid_submission" : "validation_failed",
        message: validated.spam
          ? "The submission could not be accepted."
          : "Review the form fields and try again.",
        errors: validated.errors,
      },
      origin,
    );
  }

  const remoteIp = request.headers.get("CF-Connecting-IP") || "";
  const turnstile = await verifyTurnstile({
    token: validated.values.turnstileToken,
    remoteIp,
    config,
    fetchImpl,
  });

  if (!turnstile.ok) {
    return jsonResponse(
      turnstile.unavailable ? 503 : 400,
      {
        ok: false,
        code: turnstile.unavailable
          ? "verification_unavailable"
          : "verification_failed",
        message: turnstile.unavailable
          ? "Spam protection is temporarily unavailable. Please use the email link or try again."
          : "Spam protection could not verify this submission. Please try again.",
      },
      origin,
    );
  }

  const delivered = await sendEmail({
    values: validated.values,
    config,
    fetchImpl,
  });
  if (!delivered.ok) {
    return jsonResponse(
      502,
      {
        ok: false,
        code: "delivery_failed",
        message:
          "The message could not be delivered. Your entries are still here; please retry or use the email link.",
      },
      origin,
    );
  }

  return jsonResponse(
    200,
    {
      ok: true,
      code: "delivered",
      message: "Your inquiry was delivered. Expect a reply within 1–2 business days.",
    },
    origin,
  );
}
