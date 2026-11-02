import assert from "node:assert/strict";
import test from "node:test";
import { handleContactRequest } from "../server/contact.mjs";

const origin = "https://eurodigital.ca";
const validBody = {
  name: "David Example",
  email: "david@example.com",
  business: "Example Roofing",
  projectType: "business-website",
  message:
    "We need a professional website for our roofing business and quote requests.",
  website: "",
  turnstileToken: "test-token",
  submissionId: "9b5cbb2d-18c6-4f60-9cc9-1f6b6c606808",
  attribution: { pagePath: "/web-design" },
};

const baseEnv = {
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  RESEND_API_KEY: "resend-key",
  CONTACT_FROM_EMAIL: "EuroDigital <website@eurodigital.ca>",
  CONTACT_TO_EMAIL: "contact@eurodigital.ca",
  CONTACT_ALLOWED_ORIGINS: origin,
  TURNSTILE_ALLOWED_HOSTNAMES: "eurodigital.ca",
};

function request(body = validBody) {
  return new Request("https://eurodigital.ca/api/contact", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fetchMock(events, options = {}) {
  const calls = [];
  const mock = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("siteverify")) {
      events.push("fetch:turnstile");
      return Response.json({
        success: true,
        hostname: "eurodigital.ca",
        action: "contact",
      });
    }
    events.push("fetch:resend");
    if (options.resendThrows) {
      throw new Error("network unreachable");
    }
    return Response.json(options.resend || { id: "email-id" }, {
      status: options.resendStatus || 200,
    });
  };
  mock.calls = calls;
  return mock;
}

// Minimal in-memory stand-in for the D1 binding surface the handler uses
// (prepare -> bind -> run / first), keyed by submission_id like the real
// table.
function fakeDb(events, control = {}) {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              if (sql.includes("SELECT") && sql.includes("contact_enquiries")) {
                events.push("db:select");
                if (control.failSelect) throw new Error("d1 select failed");
                return rows.get(params[0]) ?? null;
              }
              throw new Error(`unexpected SQL: ${sql}`);
            },
            async run() {
              if (sql.includes("INSERT OR IGNORE INTO contact_enquiries")) {
                events.push("db:insert");
                if (control.failInsert) throw new Error("d1 insert failed");
                const [
                  submissionId,
                  createdAt,
                  updatedAt,
                  name,
                  email,
                  business,
                  projectType,
                  message,
                  sourcePage,
                  attribution,
                ] = params;
                if (!rows.has(submissionId)) {
                  rows.set(submissionId, {
                    submission_id: submissionId,
                    created_at: createdAt,
                    updated_at: updatedAt,
                    name,
                    email,
                    business,
                    project_type: projectType,
                    message,
                    source_page: sourcePage,
                    attribution,
                    status: "pending",
                    provider_message_id: null,
                    failure_reason: null,
                  });
                }
                return { success: true };
              }
              if (sql.includes("UPDATE contact_enquiries")) {
                events.push("db:update");
                if (control.failUpdate) throw new Error("d1 update failed");
                const [status, providerMessageId, failureReason, , submissionId] =
                  params;
                const row = rows.get(submissionId);
                // Mirrors the SQL guard: an 'accepted' row is never updated.
                if (row && row.status !== "accepted") {
                  Object.assign(row, {
                    status,
                    provider_message_id: providerMessageId,
                    failure_reason: failureReason,
                  });
                }
                return { success: true };
              }
              throw new Error(`unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  };
}

function envWithDb(db) {
  return { ...baseEnv, CONTACT_DB: db };
}

test("records the enquiry before sending and stores the provider ID on acceptance", async () => {
  const events = [];
  const db = fakeDb(events);
  const mock = fetchMock(events);
  const response = await handleContactRequest(request(), envWithDb(db), mock);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.code, "accepted");
  assert.equal(body.providerMessageId, "email-id");

  // Record-before-send ordering: the durable insert precedes the Resend call.
  assert.ok(events.indexOf("db:insert") >= 0);
  assert.ok(events.indexOf("db:insert") < events.indexOf("fetch:resend"));
  assert.ok(events.indexOf("db:update") > events.indexOf("fetch:resend"));

  assert.equal(db.rows.size, 1);
  const row = db.rows.get(validBody.submissionId);
  assert.equal(row.name, validBody.name);
  assert.equal(row.email, validBody.email);
  assert.equal(row.business, validBody.business);
  assert.equal(row.project_type, validBody.projectType);
  assert.equal(row.message, validBody.message);
  assert.equal(row.source_page, "/web-design");
  assert.match(row.attribution, /"pagePath":"\/web-design"/);
  assert.equal(row.status, "accepted");
  assert.equal(row.provider_message_id, "email-id");
  assert.equal(row.failure_reason, null);
  assert.ok(!Number.isNaN(Date.parse(row.created_at)));
});

test("provider rejection retains the record as failed and returns delivery_failed", async () => {
  const events = [];
  const db = fakeDb(events);
  const mock = fetchMock(events, { resendStatus: 500, resend: {} });
  const response = await handleContactRequest(request(), envWithDb(db), mock);

  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "delivery_failed");

  const row = db.rows.get(validBody.submissionId);
  assert.ok(row, "the enquiry record is retained after a provider rejection");
  assert.equal(row.status, "failed");
  assert.equal(row.failure_reason, "provider_rejected:500");
  assert.equal(row.provider_message_id, null);
});

test("unconfirmed provider outcome retains the record as unconfirmed", async () => {
  const events = [];
  const db = fakeDb(events);
  const mock = fetchMock(events, { resendThrows: true });
  const response = await handleContactRequest(request(), envWithDb(db), mock);

  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "delivery_unconfirmed");

  const row = db.rows.get(validBody.submissionId);
  assert.ok(row, "the enquiry record is retained when delivery is unconfirmed");
  assert.equal(row.status, "unconfirmed");
  assert.equal(row.failure_reason, "provider_unconfirmed");
  assert.equal(row.provider_message_id, null);
});

test("initial storage failure sends nothing and reports temporarily unavailable", async () => {
  const events = [];
  const db = fakeDb(events, { failInsert: true });
  const mock = fetchMock(events);
  const response = await handleContactRequest(request(), envWithDb(db), mock);

  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "temporarily_unavailable");
  // Turnstile ran, but Resend was never called and nothing claims success.
  assert.equal(mock.calls.length, 1);
  assert.match(mock.calls[0].url, /siteverify/);
  assert.equal(events.includes("fetch:resend"), false);
  assert.equal(db.rows.size, 0);
});

test("acceptance that cannot be recorded is reported unconfirmed and a retry reconciles it", async () => {
  const events = [];
  const control = { failUpdate: true };
  const db = fakeDb(events, control);
  const mock = fetchMock(events);
  const env = envWithDb(db);

  const first = await handleContactRequest(request(), env, mock);
  assert.equal(first.status, 503);
  assert.equal((await first.json()).code, "delivery_unconfirmed");
  const pending = db.rows.get(validBody.submissionId);
  assert.ok(pending, "the pending enquiry is retained");
  assert.equal(pending.status, "pending");
  assert.equal(pending.provider_message_id, null);

  // Retry with the same submission ID: the insert is ignored, the idempotent
  // Resend call returns the same provider ID, and the recording succeeds.
  control.failUpdate = false;
  const second = await handleContactRequest(request(), env, mock);
  assert.equal(second.status, 200);
  const secondBody = await second.json();
  assert.equal(secondBody.code, "accepted");
  assert.equal(secondBody.providerMessageId, "email-id");

  assert.equal(db.rows.size, 1);
  const row = db.rows.get(validBody.submissionId);
  assert.equal(row.status, "accepted");
  assert.equal(row.provider_message_id, "email-id");
  const resendCalls = mock.calls.filter((call) =>
    call.url.includes("resend.com"),
  );
  assert.equal(resendCalls.length, 2);
  for (const call of resendCalls) {
    assert.equal(
      call.init.headers["Idempotency-Key"],
      `contact/${validBody.submissionId}`,
    );
  }
});

test("a later failed retry cannot overwrite a confirmed acceptance", async () => {
  const events = [];
  const db = fakeDb(events);
  const env = envWithDb(db);

  const first = await handleContactRequest(request(), env, fetchMock(events));
  assert.equal(first.status, 200);
  assert.equal((await first.json()).code, "accepted");

  // The browser never saw the 200, so the form retries with the same
  // submission ID — and this attempt's provider call fails transiently.
  const retry = await handleContactRequest(
    request(),
    env,
    fetchMock(events, { resendThrows: true }),
  );
  assert.equal(retry.status, 503);
  assert.equal((await retry.json()).code, "delivery_unconfirmed");

  // The confirmed acceptance and its provider message ID survive intact.
  assert.equal(db.rows.size, 1);
  const row = db.rows.get(validBody.submissionId);
  assert.equal(row.status, "accepted");
  assert.equal(row.provider_message_id, "email-id");
  assert.equal(row.failure_reason, null);
});

test("a retry with changed details under the same submission ID is rejected and sends nothing", async () => {
  const events = [];
  const db = fakeDb(events);
  const env = envWithDb(db);

  // First attempt: the provider outcome is unconfirmed, so the row is
  // retained as unconfirmed and the visitor is told to retry.
  const first = await handleContactRequest(
    request(),
    env,
    fetchMock(events, { resendThrows: true }),
  );
  assert.equal(first.status, 503);
  assert.equal((await first.json()).code, "delivery_unconfirmed");

  // The retry edits the message but keeps the same submission ID. The
  // recorded payload is authoritative, so the changed version must not be
  // sent under the same Resend idempotency key.
  const retryMock = fetchMock(events);
  const retry = await handleContactRequest(
    request({
      ...validBody,
      message:
        "Actually, we also need an online store added to the quote please.",
    }),
    env,
    retryMock,
  );
  assert.equal(retry.status, 409);
  assert.equal((await retry.json()).code, "submission_conflict");
  assert.equal(
    retryMock.calls.filter((call) => call.url.includes("resend.com")).length,
    0,
  );

  // The recorded enquiry is untouched: original message, original status.
  assert.equal(db.rows.size, 1);
  const row = db.rows.get(validBody.submissionId);
  assert.equal(row.message, validBody.message);
  assert.equal(row.status, "unconfirmed");
  assert.equal(row.provider_message_id, null);
});

test("a changed-details retry after acceptance is rejected and the acceptance stands", async () => {
  const events = [];
  const db = fakeDb(events);
  const env = envWithDb(db);

  const first = await handleContactRequest(request(), env, fetchMock(events));
  assert.equal(first.status, 200);
  assert.equal((await first.json()).code, "accepted");

  const retryMock = fetchMock(events);
  const retry = await handleContactRequest(
    request({ ...validBody, business: "A Different Business Entirely" }),
    env,
    retryMock,
  );
  assert.equal(retry.status, 409);
  assert.equal((await retry.json()).code, "submission_conflict");
  assert.equal(
    retryMock.calls.filter((call) => call.url.includes("resend.com")).length,
    0,
  );

  const row = db.rows.get(validBody.submissionId);
  assert.equal(row.business, validBody.business);
  assert.equal(row.status, "accepted");
  assert.equal(row.provider_message_id, "email-id");
});

test("a retry replays the recorded attribution instead of fresh attribution", async () => {
  const events = [];
  const db = fakeDb(events);
  const env = envWithDb(db);
  const recordedBody = {
    ...validBody,
    attribution: { pagePath: "/web-design", utmSource: "newsletter" },
  };

  const first = await handleContactRequest(
    request(recordedBody),
    env,
    fetchMock(events, { resendThrows: true }),
  );
  assert.equal(first.status, 503);
  assert.equal((await first.json()).code, "delivery_unconfirmed");

  // Same enquiry details, but the retry collects different attribution
  // (the client fingerprint does not cover attribution). The resent email
  // must carry the recorded attribution so the body under the idempotency
  // key is the recorded one.
  const retryMock = fetchMock(events);
  const retry = await handleContactRequest(
    request({
      ...validBody,
      attribution: { pagePath: "/seo-services", utmSource: "changed-later" },
    }),
    env,
    retryMock,
  );
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).code, "accepted");

  const resendCalls = retryMock.calls.filter((call) =>
    call.url.includes("resend.com"),
  );
  assert.equal(resendCalls.length, 1);
  const emailBody = JSON.parse(resendCalls[0].init.body);
  assert.match(emailBody.text, /Page path: \/web-design/);
  assert.match(emailBody.text, /UTM source: newsletter/);
  assert.doesNotMatch(emailBody.text, /changed-later|\/seo-services/);
  assert.equal(
    resendCalls[0].init.headers["Idempotency-Key"],
    `contact/${validBody.submissionId}`,
  );

  const row = db.rows.get(validBody.submissionId);
  assert.equal(row.status, "accepted");
  assert.match(row.attribution, /"utmSource":"newsletter"/);
});

test("a retry replays recorded attribution byte-for-byte at a sanitize boundary", async () => {
  const events = [];
  const db = fakeDb(events);
  const env = envWithDb(db);
  // sanitizeUtm normalizes whitespace and then clamps to 100 characters,
  // so this campaign is stored as exactly 100 characters ending in a
  // space. Re-sanitizing the stored value would trim that trailing space
  // and change the email body under the same idempotency key; the replay
  // must use the recorded value untouched.
  const recordedBody = {
    ...validBody,
    attribution: { utmCampaign: `${"a".repeat(99)} b` },
  };

  const first = await handleContactRequest(
    request(recordedBody),
    env,
    fetchMock(events, { resendThrows: true }),
  );
  assert.equal(first.status, 503);
  assert.equal((await first.json()).code, "delivery_unconfirmed");

  const stored = JSON.parse(db.rows.get(validBody.submissionId).attribution);
  assert.equal(stored.utmCampaign, `${"a".repeat(99)} `);
  assert.equal(stored.utmCampaign.length, 100);

  const retryMock = fetchMock(events);
  const retry = await handleContactRequest(
    request({ ...validBody, attribution: { utmCampaign: "fresh-value" } }),
    env,
    retryMock,
  );
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).code, "accepted");

  const resendCalls = retryMock.calls.filter((call) =>
    call.url.includes("resend.com"),
  );
  assert.equal(resendCalls.length, 1);
  const emailBody = JSON.parse(resendCalls[0].init.body);
  assert.ok(
    emailBody.text.includes(`UTM campaign: ${"a".repeat(99)} `),
    "replayed email keeps the recorded campaign, trailing space included",
  );
  assert.doesNotMatch(emailBody.text, /fresh-value/);
});

test("concurrent same-ID requests: the insert loser is rejected, never sent", async () => {
  const events = [];
  const db = fakeDb(events);
  const env = envWithDb(db);
  const changedBody = {
    ...validBody,
    message: "Changed details racing under the same submission ID.",
  };

  const mockA = fetchMock(events);
  const mockB = fetchMock(events);
  const [resA, resB] = await Promise.all([
    handleContactRequest(request(validBody), env, mockA),
    handleContactRequest(request(changedBody), env, mockB),
  ]);

  // The first request records and sends its payload. The concurrent
  // request whose insert no-ops against that record is judged against
  // the recorded payload, rejected with the conflict, and never reaches
  // the provider \u2014 a read-then-insert order would have let both
  // racers observe "no record" and send divergent bodies under one key.
  assert.equal(resA.status, 200);
  assert.equal(resB.status, 409);
  assert.equal((await resB.json()).code, "submission_conflict");
  assert.equal(
    mockB.calls.filter((call) => call.url.includes("resend.com")).length,
    0,
  );
  assert.equal(
    mockA.calls.filter((call) => call.url.includes("resend.com")).length,
    1,
  );
  const row = db.rows.get(validBody.submissionId);
  assert.equal(row.message, validBody.message);
  assert.equal(row.status, "accepted");
});

test("a storage read failure sends nothing and reports temporarily unavailable", async () => {
  const events = [];
  const db = fakeDb(events, { failSelect: true });
  const mock = fetchMock(events);
  const response = await handleContactRequest(request(), envWithDb(db), mock);

  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "temporarily_unavailable");
  assert.equal(events.includes("fetch:resend"), false);
});

test("without a CONTACT_DB binding the handler keeps the previous behavior", async () => {
  const events = [];
  const mock = fetchMock(events);
  const response = await handleContactRequest(request(), baseEnv, mock);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.code, "accepted");
  assert.equal(body.providerMessageId, "email-id");
  assert.equal(events.some((event) => event.startsWith("db:")), false);
});
