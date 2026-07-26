import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPreflightReport,
  parseDotEnv,
  runSmokeChecks,
  TURNSTILE_TEST_SECRET_KEY,
  TURNSTILE_TEST_SITE_KEY,
  validateActivationConfig,
  validateSmokeTarget,
} from "../scripts/contact-activation-lib.mjs";
import { applyEuroDigitalProductionPolicy } from "../scripts/contact-project-policy.mjs";

const testEnvironment = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
  TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET_KEY,
  RESEND_API_KEY: "re_preview_12345678",
  CONTACT_FROM_EMAIL: "EuroDigital Preview <onboarding@resend.dev>",
  CONTACT_TO_EMAIL: "delivered@resend.dev",
  CONTACT_ALLOWED_ORIGINS: "https://preview.example.pages.dev",
  TURNSTILE_ALLOWED_HOSTNAMES: "preview.example.pages.dev",
};

const productionEnvironment = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAA-production-site-key",
  TURNSTILE_SECRET_KEY: "0x4AAAAAAA-production-secret-key",
  RESEND_API_KEY: "re_production_12345678",
  CONTACT_FROM_EMAIL: "EuroDigital <website@send.eurodigital.ca>",
  CONTACT_TO_EMAIL: "contact@eurodigital.ca",
  CONTACT_ALLOWED_ORIGINS: "https://eurodigital.ca,https://www.eurodigital.ca",
  TURNSTILE_ALLOWED_HOSTNAMES: "eurodigital.ca,www.eurodigital.ca",
};

test("dotenv parser supports comments and quotes", () => {
  const parsed = parseDotEnv(`
# comment
A=one
B="two\\nlines"
C='three'
D=four # inline comment
`);
  assert.deepEqual(parsed, { A: "one", B: "two\nlines", C: "three", D: "four" });
});

test("test-mode preflight accepts official Turnstile and Resend test destinations", () => {
  const report = validateActivationConfig(testEnvironment, { mode: "test" });
  assert.equal(report.ok, true);
  assert.equal(report.summary.failed, 0);
});

test("production preflight accepts non-test credentials and reviewed origins", () => {
  const report = applyEuroDigitalProductionPolicy(
    validateActivationConfig(productionEnvironment, { mode: "production" }),
    productionEnvironment,
  );
  assert.equal(report.ok, true);
  assert.equal(report.summary.failed, 0);
});

test("EuroDigital production policy rejects unrelated sender and origin hosts", () => {
  const environment = {
    ...productionEnvironment,
    CONTACT_FROM_EMAIL: "Website <website@attacker.example>",
    CONTACT_ALLOWED_ORIGINS: "https://attacker.example",
    TURNSTILE_ALLOWED_HOSTNAMES: "attacker.example",
  };
  const report = applyEuroDigitalProductionPolicy(
    validateActivationConfig(environment, { mode: "production" }),
    environment,
  );
  assert.equal(report.ok, false);
  const failed = report.checks
    .filter((item) => item.status === "fail")
    .map((item) => item.name);
  assert.ok(failed.includes("EURODIGITAL_PRODUCTION_SENDER"));
  assert.ok(failed.includes("EURODIGITAL_PRODUCTION_ORIGINS"));
  assert.ok(failed.includes("EURODIGITAL_TURNSTILE_HOSTNAMES"));
});

test("production preflight rejects test credentials and testing domains", () => {
  const report = validateActivationConfig(testEnvironment, { mode: "production" });
  assert.equal(report.ok, false);
  const failedNames = report.checks
    .filter((item) => item.status === "fail")
    .map((item) => item.name);
  assert.ok(failedNames.includes("TURNSTILE_PRODUCTION_PAIR"));
  assert.ok(failedNames.includes("PRODUCTION_RECIPIENT"));
  assert.ok(failedNames.includes("PRODUCTION_SENDER"));
});

test("preflight report never prints configuration values", () => {
  const environment = {
    ...testEnvironment,
    RESEND_API_KEY: "re_super_secret_value_12345678",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  };
  const text = formatPreflightReport(
    validateActivationConfig(environment, { mode: "test" }),
  );
  for (const value of Object.values(environment)) {
    assert.equal(text.includes(value), false);
  }
});

test("preflight rejects malformed origins and hostname misalignment", () => {
  const report = validateActivationConfig(
    {
      ...testEnvironment,
      CONTACT_ALLOWED_ORIGINS: "https://preview.example.pages.dev/path",
      TURNSTILE_ALLOWED_HOSTNAMES: "other.example.pages.dev",
    },
    { mode: "test" },
  );
  assert.equal(report.ok, false);
  assert.ok(
    report.checks.some(
      (item) => item.name === "CONTACT_ALLOWED_ORIGINS_FORMAT" && item.status === "fail",
    ),
  );
});

test("smoke target requires an exact explicit host allowlist", () => {
  assert.equal(validateSmokeTarget("https://preview.example", []).ok, false);
  assert.equal(
    validateSmokeTarget("https://preview.example", ["other.example"]).ok,
    false,
  );
  assert.equal(
    validateSmokeTarget("https://preview.example", ["preview.example"]).ok,
    true,
  );
  assert.equal(
    validateSmokeTarget("http://remote.example", ["remote.example"]).ok,
    false,
  );
  assert.equal(
    validateSmokeTarget("http://127.0.0.1:8788", ["127.0.0.1:8788"]).ok,
    true,
  );
});

test("smoke runner sends only non-delivery requests and verifies response controls", async () => {
  const expected = [
    [405, "method_not_allowed"],
    [403, "origin_not_allowed"],
    [415, "unsupported_media_type"],
    [400, "invalid_json"],
    [422, "validation_failed"],
  ];
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    const [status, code] = expected[calls.length - 1];
    return Response.json(
      { ok: false, code },
      {
        status,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  };

  const report = await runSmokeChecks({
    target: "https://preview.example",
    allowedHosts: ["preview.example"],
    fetchImpl,
  });
  assert.equal(report.ok, true);
  assert.equal(calls.length, 5);
  assert.equal(calls.some((call) => call.init.body?.includes("turnstileToken")), false);
  assert.equal(calls.some((call) => call.init.body?.includes("submissionId")), false);
});

test("smoke runner fails when endpoint headers are unsafe", async () => {
  await assert.rejects(
    runSmokeChecks({
      target: "https://preview.example",
      allowedHosts: ["preview.example"],
      fetchImpl: async () =>
        Response.json(
          { ok: false, code: "method_not_allowed" },
          { status: 405 },
        ),
    }),
    /disable caching/,
  );
});
