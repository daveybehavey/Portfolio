import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildEmailPayload,
  escapeHtml,
  handleContactRequest,
  validateContactPayload,
} from "../server/contact.mjs";

const origin = "https://eurodigital.ca";
const validBody = {
  name: "David Example",
  email: "david@example.com",
  business: "Example Roofing",
  projectType: "business-website",
  message: "We need a professional website for our roofing business and quote requests.",
  website: "",
  turnstileToken: "test-token",
  submissionId: "9b5cbb2d-18c6-4f60-9cc9-1f6b6c606808",
};

const env = {
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  RESEND_API_KEY: "resend-key",
  CONTACT_FROM_EMAIL: "EuroDigital <website@eurodigital.ca>",
  CONTACT_TO_EMAIL: "contact@eurodigital.ca",
  CONTACT_ALLOWED_ORIGINS: origin,
  TURNSTILE_ALLOWED_HOSTNAMES: "eurodigital.ca",
};

function request(body = validBody, options = {}) {
  const method = options.method || "POST";
  return new Request("https://eurodigital.ca/api/contact", {
    method,
    headers: {
      Origin: options.origin || origin,
      "Content-Type": options.contentType || "application/json",
      ...(options.headers || {}),
    },
    body:
      method === "GET" || method === "HEAD"
        ? undefined
        : options.rawBody ?? JSON.stringify(body),
  });
}

function fetchMock(options = {}) {
  const calls = [];
  const mock = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("siteverify")) {
      return Response.json(
        options.turnstile || {
          success: true,
          hostname: "eurodigital.ca",
          action: "contact",
        },
        { status: options.turnstileStatus || 200 },
      );
    }
    return Response.json(options.resend || { id: "email-id" }, {
      status: options.resendStatus || 200,
    });
  };
  mock.calls = calls;
  return mock;
}

async function json(response) {
  return response.json();
}

test("valid payload is delivered with server-side verification and delivery idempotency", async () => {
  const mock = fetchMock();
  const response = await handleContactRequest(request(), env, mock);
  assert.equal(response.status, 200);
  assert.equal((await json(response)).code, "delivered");
  assert.equal(mock.calls.length, 2);
  assert.match(mock.calls[0].url, /siteverify/);
  const verificationBody = JSON.parse(mock.calls[0].init.body);
  assert.equal(verificationBody.response, validBody.turnstileToken);
  assert.equal(verificationBody.idempotency_key, undefined);
  assert.equal(
    mock.calls[1].init.headers["Idempotency-Key"],
    `contact/${validBody.submissionId}`,
  );
  const emailBody = JSON.parse(mock.calls[1].init.body);
  assert.equal(emailBody.reply_to, validBody.email);
  assert.deepEqual(emailBody.to, [env.CONTACT_TO_EMAIL]);
});

test("rejects unsupported methods", async () => {
  const response = await handleContactRequest(
    request(undefined, { method: "GET" }),
    env,
    fetchMock(),
  );
  assert.equal(response.status, 405);
});

test("fails closed when production configuration is missing", async () => {
  const response = await handleContactRequest(request(), {}, fetchMock());
  assert.equal(response.status, 503);
  assert.equal((await json(response)).code, "form_unavailable");
});

test("rejects disallowed origins", async () => {
  const response = await handleContactRequest(
    request(validBody, { origin: "https://attacker.example" }),
    env,
    fetchMock(),
  );
  assert.equal(response.status, 403);
});

test("rejects non-JSON and malformed JSON requests", async () => {
  const nonJson = await handleContactRequest(
    request(validBody, { contentType: "text/plain" }),
    env,
    fetchMock(),
  );
  assert.equal(nonJson.status, 415);
  const malformed = await handleContactRequest(
    request(validBody, { rawBody: "{" }),
    env,
    fetchMock(),
  );
  assert.equal(malformed.status, 400);
});

test("rejects oversized requests before external calls", async () => {
  const mock = fetchMock();
  const response = await handleContactRequest(
    request(validBody, { headers: { "Content-Length": "20000" } }),
    env,
    mock,
  );
  assert.equal(response.status, 413);
  assert.equal(mock.calls.length, 0);
});

test("returns field errors for invalid payloads", async () => {
  const response = await handleContactRequest(
    request({ ...validBody, name: "", email: "bad", message: "short" }),
    env,
    fetchMock(),
  );
  assert.equal(response.status, 422);
  const body = await json(response);
  assert.ok(body.errors.name);
  assert.ok(body.errors.email);
  assert.ok(body.errors.message);
});

test("honeypot submissions are rejected without external calls", async () => {
  const mock = fetchMock();
  const response = await handleContactRequest(
    request({ ...validBody, website: "https://spam.example" }),
    env,
    mock,
  );
  assert.equal(response.status, 400);
  assert.equal(mock.calls.length, 0);
});

test("rejects failed, duplicate, wrong-host, and wrong-action Turnstile results", async () => {
  for (const turnstile of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, hostname: "attacker.example", action: "contact" },
    { success: true, hostname: "eurodigital.ca", action: "login" },
    { success: true, hostname: "example.com", action: null },
    { success: true, hostname: "", action: "contact" },
  ]) {
    const mock = fetchMock({ turnstile });
    const response = await handleContactRequest(request(), env, mock);
    assert.equal(response.status, 400);
    assert.equal((await json(response)).code, "verification_failed");
    assert.equal(mock.calls.length, 1);
    assert.match(mock.calls[0].url, /siteverify/);
  }
});

const dummyTurnstileMetadata = {
  success: true,
  hostname: "example.com",
  action: null,
};

const officialDummyTestEnv = {
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  RESEND_API_KEY: "resend-test-key-not-real",
  CONTACT_FROM_EMAIL: "EuroDigital Preview <onboarding@resend.dev>",
  CONTACT_TO_EMAIL: "delivered@resend.dev",
  CONTACT_ALLOWED_ORIGINS: "http://127.0.0.1:8788",
  TURNSTILE_ALLOWED_HOSTNAMES: "127.0.0.1",
};

const officialDummyBody = {
  ...validBody,
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
};

function dummyRequest(body = officialDummyBody, options = {}) {
  return request(body, {
    origin: "http://127.0.0.1:8788",
    ...options,
  });
}

test("official safe Turnstile dummy path succeeds after Siteverify", async () => {
  const mock = fetchMock({ turnstile: dummyTurnstileMetadata });
  const response = await handleContactRequest(
    dummyRequest(),
    officialDummyTestEnv,
    mock,
  );
  assert.equal(response.status, 200);
  assert.equal((await json(response)).code, "delivered");
  assert.equal(mock.calls.length, 2);
  assert.match(mock.calls[0].url, /siteverify/);
  assert.match(mock.calls[1].url, /api\.resend\.com\/emails/);
  const verificationBody = JSON.parse(mock.calls[0].init.body);
  assert.equal(verificationBody.response, "XXXX.DUMMY.TOKEN.XXXX");
  assert.equal(
    verificationBody.secret,
    "1x0000000000000000000000000000000AA",
  );
  const emailBody = JSON.parse(mock.calls[1].init.body);
  assert.deepEqual(emailBody.to, ["delivered@resend.dev"]);
  assert.equal(
    emailBody.from,
    "EuroDigital Preview <onboarding@resend.dev>",
  );
});

test("real recipient prevents Turnstile dummy metadata bypass", async () => {
  const mock = fetchMock({ turnstile: dummyTurnstileMetadata });
  const response = await handleContactRequest(
    dummyRequest(),
    {
      ...officialDummyTestEnv,
      CONTACT_TO_EMAIL: "contact@eurodigital.ca",
    },
    mock,
  );
  assert.equal(response.status, 400);
  assert.equal((await json(response)).code, "verification_failed");
  assert.equal(mock.calls.length, 1);
  assert.match(mock.calls[0].url, /siteverify/);
});

test("non-test sender prevents Turnstile dummy metadata bypass", async () => {
  const mock = fetchMock({ turnstile: dummyTurnstileMetadata });
  const response = await handleContactRequest(
    dummyRequest(),
    {
      ...officialDummyTestEnv,
      CONTACT_FROM_EMAIL: "EuroDigital <website@send.eurodigital.ca>",
    },
    mock,
  );
  assert.equal(response.status, 400);
  assert.equal((await json(response)).code, "verification_failed");
  assert.equal(mock.calls.length, 1);
  assert.match(mock.calls[0].url, /siteverify/);
});

test("non-dummy token prevents Turnstile dummy metadata bypass", async () => {
  const mock = fetchMock({ turnstile: dummyTurnstileMetadata });
  const response = await handleContactRequest(
    dummyRequest({
      ...officialDummyBody,
      turnstileToken: "not-the-official-dummy-token",
    }),
    officialDummyTestEnv,
    mock,
  );
  assert.equal(response.status, 400);
  assert.equal((await json(response)).code, "verification_failed");
  assert.equal(mock.calls.length, 1);
  assert.match(mock.calls[0].url, /siteverify/);
});

test("production credentials retain strict hostname and action validation", async () => {
  for (const turnstile of [
    { success: true, hostname: "example.com", action: "contact" },
    { success: true, hostname: "eurodigital.ca", action: null },
    { success: true, hostname: "eurodigital.ca", action: "test" },
  ]) {
    const mock = fetchMock({ turnstile });
    const response = await handleContactRequest(request(), env, mock);
    assert.equal(response.status, 400);
    assert.equal((await json(response)).code, "verification_failed");
    assert.equal(mock.calls.length, 1);
  }
});

test("reports temporary Turnstile and email provider failures without exposing details", async () => {
  const turnstileResponse = await handleContactRequest(
    request(),
    env,
    async () => new Response("unavailable", { status: 503 }),
  );
  assert.equal(turnstileResponse.status, 503);

  const resendMock = fetchMock({
    resendStatus: 500,
    resend: { message: "provider internals" },
  });
  const resendResponse = await handleContactRequest(request(), env, resendMock);
  assert.equal(resendResponse.status, 502);
  assert.doesNotMatch(
    JSON.stringify(await json(resendResponse)),
    /provider internals/,
  );
});

test("HTML output escapes untrusted visitor content", () => {
  const values = {
    ...validBody,
    name: '<img src=x onerror="alert(1)">',
    message: "<script>alert('x')</script>",
  };
  const payload = buildEmailPayload(values, {
    fromEmail: env.CONTACT_FROM_EMAIL,
    toEmail: env.CONTACT_TO_EMAIL,
  });
  assert.doesNotMatch(payload.html, /<script>/);
  assert.match(payload.html, /&lt;script&gt;/);
  assert.match(payload.html, /&quot;alert\(1\)&quot;/);
  assert.equal(escapeHtml("A&B"), "A&amp;B");
});

test("payload validator enforces UUID, project type, and token limits", () => {
  const result = validateContactPayload({
    ...validBody,
    projectType: "invalid",
    submissionId: "not-a-uuid",
    turnstileToken: "x".repeat(2049),
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.projectType);
  assert.ok(result.errors.submissionId);
  assert.ok(result.errors.turnstileToken);
});

test("client records a lead only after a confirmed successful response", async () => {
  const source = await readFile(
    new URL("../src/components/ContactForm.tsx", import.meta.url),
    "utf8",
  );
  const failureGuard = source.indexOf("if (!response.ok || !result.ok)");
  const analyticsCall = source.indexOf(
    'trackGenerateLead({ method: "contact_form", location: "contact" })',
  );
  assert.ok(failureGuard >= 0);
  assert.ok(analyticsCall > failureGuard);
  assert.equal(
    source.indexOf(
      'trackGenerateLead({ method: "contact_form", location: "contact" })',
      analyticsCall + 1,
    ),
    -1,
  );
});

test("client keeps the direct email fallback", async () => {
  const source = await readFile(
    new URL("../src/components/ContactForm.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /mailto:\$\{email\}/);
  assert.match(source, /Email directly/);
});
