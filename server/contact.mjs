import {
  buildAttributionEmailSection,
  hasAttribution,
  sanitizeAttribution,
} from "./lead-attribution.mjs";

const MAX_REQUEST_BYTES = 16_384;
const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const CONTACT_ACTION = "contact";
const EXTERNAL_REQUEST_TIMEOUT_MS = 8_000;
const TURNSTILE_ALWAYS_PASS_TEST_SECRET =
  "1x0000000000000000000000000000000AA";
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const RESEND_TEST_SENDER = "onboarding@resend.dev";
const RESEND_TEST_RECIPIENT = "delivered@resend.dev";

const PROJECT_TYPES = new Map([
  ["small-repair", "Small website repair / cleanup"],
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

function extractMailbox(value) {
  const text = cleanText(value);
  if (!text || /[\r\n]/.test(text)) {
    return "";
  }

  const angleMatch = text.match(/<([^<>]+)>\s*$/);
  const mailbox = cleanText(angleMatch ? angleMatch[1] : text).toLowerCase();
  if (!mailbox || /[\r\n<>]/.test(mailbox) || !isEmail(mailbox)) {
    return "";
  }
  return mailbox;
}

function isSafeTurnstileDummyTest({ token, config }) {
  return (
    token === TURNSTILE_DUMMY_TOKEN &&
    config.turnstileSecret === TURNSTILE_ALWAYS_PASS_TEST_SECRET &&
    extractMailbox(config.fromEmail) === RESEND_TEST_SENDER &&
    extractMailbox(config.toEmail) === RESEND_TEST_RECIPIENT
  );
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
    // Optional; never used for auth, recipients, or delivery routing.
    attribution: sanitizeAttribution(input.attribution),
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

  const attributionSection = buildAttributionEmailSection(
    values.attribution,
    escapeHtml,
  );

  const text = [
    "New EuroDigital website inquiry",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    values.message,
    ...(attributionSection ? [attributionSection.text] : []),
  ].join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const attributionHtml = attributionSection ? attributionSection.html : "";

  const html = `<!doctype html><html><body><h1>New EuroDigital website inquiry</h1><table>${htmlRows}</table><h2>Message</h2><p style="white-space:pre-wrap">${escapeHtml(values.message)}</p>${attributionHtml}</body></html>`;

  return {
    from: config.fromEmail,
    to: [config.toEmail],
    reply_to: values.email,
    subject,
    text,
    html,
  };
}

// Re-export for focused tests.
export { hasAttribution, sanitizeAttribution };

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
      code: "invalid_request",
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

  // Official Cloudflare dummy tokens still pass Siteverify, but their returned
  // hostname/action metadata does not match production widget configuration.
  // Skip only those metadata checks when the exact documented non-inbox test
  // configuration is in use. Siteverify success remains mandatory.
  if (isSafeTurnstileDummyTest({ token, config })) {
    return { ok: true, dummyTestPath: true };
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
    // Network failure or timeout: Resend may or may not have accepted the
    // message, so delivery is unconfirmed rather than failed. The submission
    // ID is the Resend idempotency key, so a retry with the same ID checks
    // this submission instead of sending a duplicate.
    return { ok: false, unconfirmed: true };
  }

  if (!response.ok) {
    return { ok: false, unconfirmed: false, status: response.status };
  }

  let result;
  try {
    result = await response.json();
  } catch {
    return { ok: false, unconfirmed: true };
  }

  // Only a usable provider message ID confirms acceptance. An OK response
  // without one cannot be treated as a confirmed handoff.
  const providerMessageId = cleanText(result?.id);
  if (!providerMessageId) {
    return { ok: false, unconfirmed: true };
  }

  return { ok: true, providerMessageId };
}

// --- Durable intake -------------------------------------------------------
// When the CONTACT_DB D1 binding is present (Production; the committed-config
// preflight requires it there), every validated, challenge-passed enquiry is
// recorded BEFORE the email send and its outcome is recorded afterwards, so
// a provider-side loss can never erase the only copy of an enquiry. Without
// a binding (Preview/local), intake is skipped and delivery behaves exactly
// as before.

function getIntakeDb(env) {
  const db = env?.CONTACT_DB;
  return db && typeof db.prepare === "function" ? db : null;
}

async function recordPendingEnquiry(db, values, now) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO contact_enquiries
         (submission_id, created_at, updated_at, name, email, business,
          project_type, message, source_page, attribution, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      values.submissionId,
      now,
      now,
      values.name,
      values.email,
      values.business,
      values.projectType,
      values.message,
      values.attribution?.pagePath || null,
      hasAttribution(values.attribution)
        ? JSON.stringify(values.attribution)
        : null,
    )
    .run();
}

async function readRecordedEnquiry(db, submissionId) {
  const row = await db
    .prepare(
      `SELECT submission_id, name, email, business, project_type, message,
              attribution
         FROM contact_enquiries
        WHERE submission_id = ?`,
    )
    .bind(submissionId)
    .first();
  return row || null;
}

// The recorded payload is authoritative for a submission ID. The Resend
// idempotency key is derived from that ID, so a retry must replay the
// recorded enquiry — a changed payload under the same key would hand the
// provider a different email body than the one the key was minted for.
function sameRecordedPayload(row, values) {
  return (
    row.name === values.name &&
    row.email === values.email &&
    row.business === values.business &&
    row.project_type === values.projectType &&
    row.message === values.message
  );
}

// The recorded attribution was sanitized before it was stored, and it
// must be replayed exactly as recorded: sanitizing it a second time is
// not idempotent (normalize-then-clamp can store a value that ends in a
// space, which a second pass trims), and any difference changes the
// email body under the same idempotency key. Only the shape is
// re-checked here; stored string values pass through untouched.
function recordedAttribution(row) {
  if (!row?.attribution) {
    return {};
  }
  try {
    const parsed = JSON.parse(row.attribution);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => typeof value === "string",
      ),
    );
  } catch {
    return {};
  }
}

// A confirmed acceptance is terminal: if the browser loses the success
// response and retries with the same submission ID, a transient failure on
// that retry must not overwrite the acceptance or erase the provider
// message ID, so this update never touches an 'accepted' row.
async function recordEnquiryOutcome(db, submissionId, outcome, now) {
  await db
    .prepare(
      `UPDATE contact_enquiries
         SET status = ?, provider_message_id = ?, failure_reason = ?,
             updated_at = ?
       WHERE submission_id = ? AND status != 'accepted'`,
    )
    .bind(
      outcome.status,
      outcome.providerMessageId || null,
      outcome.failureReason || null,
      now,
      submissionId,
    )
    .run();
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
      code: "temporarily_unavailable",
      message:
        "The online form is temporarily unavailable. Please use the email link instead.",
    });
  }

  const origin = normalizeOrigin(request.headers.get("origin") || "");
  if (!origin || !config.allowedOrigins.includes(origin)) {
    return jsonResponse(403, {
      ok: false,
      code: "source_rejected",
      message: "This request origin is not allowed. Please use the email link instead.",
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
        fieldErrors: validated.errors,
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
      turnstile.unavailable ? 503 : 403,
      {
        ok: false,
        code: turnstile.unavailable
          ? "temporarily_unavailable"
          : "challenge_failed",
        message: turnstile.unavailable
          ? "Spam protection is temporarily unavailable. Your entries are still here; retry or use the email link."
          : "Complete the spam-protection check again. Your entries are still here.",
      },
      origin,
    );
  }

  // Record the enquiry durably before handing it to the email provider. If
  // the record cannot be written, do not send: an enquiry that exists only
  // in the provider's hands is exactly the loss this intake exists to stop.
  // When a record already exists for this submission ID, it is
  // authoritative: a retry carrying different enquiry details is rejected
  // rather than resent under the same Resend idempotency key, and a retry
  // with matching details replays the recorded payload (including its
  // attribution) so the resent body is the recorded one.
  const intakeDb = getIntakeDb(env);
  let sendValues = validated.values;
  if (intakeDb) {
    try {
      // The insert is the claim (INSERT OR IGNORE): whichever request
      // records the submission ID first owns the recorded payload. The
      // row is then read back, so a request that loses a concurrent race
      // sees the winning record — not the empty read a read-then-insert
      // order would hand both racers — and is rejected or replays
      // exactly like a sequential retry.
      await recordPendingEnquiry(
        intakeDb,
        validated.values,
        new Date().toISOString(),
      );
      const recorded = await readRecordedEnquiry(
        intakeDb,
        validated.values.submissionId,
      );
      if (!recorded) {
        throw new Error("recorded enquiry missing after insert");
      }
      if (!sameRecordedPayload(recorded, validated.values)) {
        return jsonResponse(
          409,
          {
            ok: false,
            code: "submission_conflict",
            message:
              "This submission was already recorded with different details, so the changed version cannot be sent under the same reference. Refresh the page to start a new inquiry; the recorded version is the one on file.",
          },
          origin,
        );
      }
      sendValues = {
        ...validated.values,
        attribution: recordedAttribution(recorded),
      };
    } catch {
      return jsonResponse(
        503,
        {
          ok: false,
          code: "temporarily_unavailable",
          message:
            "We could not record your inquiry just now. Your entries are still here; retry or use the email link.",
        },
        origin,
      );
    }
  }

  const delivery = await sendEmail({
    values: sendValues,
    config,
    fetchImpl,
  });
  if (!delivery.ok) {
    if (intakeDb) {
      try {
        await recordEnquiryOutcome(
          intakeDb,
          validated.values.submissionId,
          {
            status: delivery.unconfirmed ? "unconfirmed" : "failed",
            failureReason: delivery.unconfirmed
              ? "provider_unconfirmed"
              : `provider_rejected:${delivery.status}`,
          },
          new Date().toISOString(),
        );
      } catch {
        // Best effort only: the pending record is retained either way, and
        // the visitor-facing delivery error below is unchanged.
      }
    }
    return jsonResponse(
      503,
      {
        ok: false,
        code: delivery.unconfirmed ? "delivery_unconfirmed" : "delivery_failed",
        message: delivery.unconfirmed
          ? "We could not confirm delivery. Your entries are still here. Retry to check this submission before sending another."
          : "We could not hand your inquiry to our email service. Your entries are still here; retry or email directly.",
      },
      origin,
    );
  }

  if (intakeDb) {
    try {
      await recordEnquiryOutcome(
        intakeDb,
        validated.values.submissionId,
        { status: "accepted", providerMessageId: delivery.providerMessageId },
        new Date().toISOString(),
      );
    } catch {
      // Resend accepted the message, but the acceptance could not be
      // recorded. Report the delivery as unconfirmed rather than claiming
      // success: a retry with the same submission ID re-checks the
      // idempotent send and retries the recording, and the pending enquiry
      // is retained for reconciliation either way.
      return jsonResponse(
        503,
        {
          ok: false,
          code: "delivery_unconfirmed",
          message:
            "We could not confirm delivery. Your entries are still here. Retry to check this submission before sending another.",
        },
        origin,
      );
    }
  }

  return jsonResponse(
    200,
    {
      ok: true,
      code: "accepted",
      message: `Your inquiry was accepted by our email service for delivery. Reference: ${validated.values.submissionId}.`,
      reference: validated.values.submissionId,
      // The provider message ID is the only handle that can be looked up in
      // the sending account afterwards. The submission reference is a local
      // idempotency key and is not searchable in the provider's send log, so
      // discarding the provider ID here would make a downstream delivery
      // loss untraceable. It is issued only on confirmed acceptance.
      providerMessageId: delivery.providerMessageId,
    },
    origin,
  );
}
