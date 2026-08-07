/**
 * Issue #17 Phase B — privacy-conscious lead attribution.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  ATTRIBUTION_LIMITS,
  buildAttributionEmailSection,
  hasAttribution,
  sanitizeAttribution,
  sanitizeCtaLocation,
  sanitizePath,
  sanitizeReferrer,
  sanitizeUtm,
} from "../server/lead-attribution.mjs";
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
  message:
    "We need a professional website for our roofing business and quote requests.",
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

const completeAttribution = {
  pagePath: "/website-design-vancouver-island",
  landingPath: "/",
  ctaLabel: "Request a project estimate",
  ctaLocation: "service",
  utmSource: "newsletter",
  utmMedium: "email",
  utmCampaign: "spring-launch",
  utmContent: "hero-banner",
  referrer: "https://www.google.com/search?q=secret",
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

test("absent attribution sanitizes to empty object", () => {
  assert.deepEqual(sanitizeAttribution(undefined), {});
  assert.deepEqual(sanitizeAttribution(null), {});
  assert.deepEqual(sanitizeAttribution("string"), {});
  assert.deepEqual(sanitizeAttribution([]), {});
  assert.equal(hasAttribution({}), false);
});

test("valid complete attribution is preserved with referrer query stripped", () => {
  const cleaned = sanitizeAttribution(completeAttribution);
  assert.equal(cleaned.pagePath, "/website-design-vancouver-island");
  assert.equal(cleaned.landingPath, "/");
  assert.equal(cleaned.ctaLabel, "Request a project estimate");
  assert.equal(cleaned.ctaLocation, "service");
  assert.equal(cleaned.utmSource, "newsletter");
  assert.equal(cleaned.utmMedium, "email");
  assert.equal(cleaned.utmCampaign, "spring-launch");
  assert.equal(cleaned.utmContent, "hero-banner");
  assert.equal(cleaned.referrer, "https://www.google.com/search");
  assert.equal(hasAttribution(cleaned), true);
});

test("unknown attribution fields are ignored", () => {
  const cleaned = sanitizeAttribution({
    pagePath: "/projects",
    fingerprint: "abc",
    ip: "1.2.3.4",
    nested: { evil: true },
    authorization: "Bearer hack",
  });
  assert.deepEqual(cleaned, { pagePath: "/projects" });
});

test("wrong attribution types are omitted without failing the form", () => {
  const result = validateContactPayload({
    ...validBody,
    attribution: {
      pagePath: 123,
      ctaLabel: null,
      utmSource: { x: 1 },
      landingPath: "/projects/maestrosservices",
    },
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.values.attribution, {
    landingPath: "/projects/maestrosservices",
  });
});

test("field-by-field maximum lengths are enforced", () => {
  for (const [key, max] of Object.entries(ATTRIBUTION_LIMITS)) {
    const over = "a".repeat(max + 25);
    const sample = { [key]: key === "referrer" ? `https://example.com/${over}` : over };
    if (key === "ctaLocation") {
      sample.ctaLocation = `${"hero"}${"x".repeat(40)}`;
    }
    if (key === "pagePath" || key === "landingPath") {
      sample[key] = `/${"a".repeat(max + 10)}`;
    }
    if (key === "referrer") {
      sample.referrer = `https://example.com/${"p".repeat(max)}`;
    }
    const cleaned = sanitizeAttribution(sample);
    if (cleaned[key]) {
      assert.ok(
        cleaned[key].length <= max,
        `${key} length ${cleaned[key].length} exceeds ${max}`,
      );
    }
  }

  const pathOver = sanitizePath(`/${"z".repeat(300)}`);
  assert.ok(pathOver.length <= ATTRIBUTION_LIMITS.pagePath);
});

test("whitespace is normalized and control characters are stripped", () => {
  const cleaned = sanitizeAttribution({
    ctaLabel: "  Request\ta\nproject\u0000estimate  ",
    utmCampaign: "spring\u0007launch",
    pagePath: "/projects/starmapco",
  });
  assert.equal(cleaned.ctaLabel, "Request a project estimate");
  assert.equal(cleaned.utmCampaign, "spring launch");
  assert.equal(sanitizeUtm("  hello\nworld  ", 100), "hello world");
});

test("HTML and email escaping apply to attribution values", () => {
  const attribution = sanitizeAttribution({
    ctaLabel: `<img src=x onerror=alert(1)>`,
    pagePath: "/projects",
  });
  const section = buildAttributionEmailSection(attribution, escapeHtml);
  assert.ok(section);
  assert.match(section.html, /&lt;img/);
  assert.doesNotMatch(section.html, /<img src=x/);

  const email = buildEmailPayload(
    {
      ...validBody,
      attribution,
    },
    {
      fromEmail: env.CONTACT_FROM_EMAIL,
      toEmail: env.CONTACT_TO_EMAIL,
    },
  );
  assert.match(email.html, /Lead attribution/);
  assert.match(email.text, /Lead attribution/);
  assert.doesNotMatch(email.html, /<img src=x/);
  assert.equal(email.reply_to, validBody.email);
  assert.deepEqual(email.to, [env.CONTACT_TO_EMAIL]);
});

test("malformed URLs and unsafe schemes are dropped from referrer", () => {
  assert.equal(sanitizeReferrer("not a url"), "");
  assert.equal(sanitizeReferrer("javascript:alert(1)"), "");
  assert.equal(sanitizeReferrer("data:text/html,hi"), "");
  assert.equal(sanitizeReferrer("ftp://files.example/a"), "");
  assert.equal(
    sanitizeReferrer("https://user:pass@evil.example/path?q=1#frag"),
    "https://evil.example/path",
  );
});

test("path allowlisting rejects absolute URLs and odd characters", () => {
  assert.equal(sanitizePath("https://evil.example/phish"), "");
  assert.equal(sanitizePath("/projects/<script>"), "");
  assert.equal(sanitizePath("/projects/maestrosservices"), "/projects/maestrosservices");
  assert.equal(sanitizePath("/website-design-vancouver-island/"), "/website-design-vancouver-island");
});

test("CTA location allowlisting rejects unknown locations", () => {
  assert.equal(sanitizeCtaLocation("hero"), "hero");
  assert.equal(sanitizeCtaLocation("case_study"), "case_study");
  assert.equal(sanitizeCtaLocation("attacker"), "");
  assert.equal(sanitizeCtaLocation("HEADER"), "");
});

test("attribution omitted from email when empty; included when present", () => {
  const empty = buildEmailPayload(
    { ...validBody, attribution: {} },
    { fromEmail: env.CONTACT_FROM_EMAIL, toEmail: env.CONTACT_TO_EMAIL },
  );
  assert.doesNotMatch(empty.html, /Lead attribution/);
  assert.doesNotMatch(empty.text, /Lead attribution/);

  const full = buildEmailPayload(
    {
      ...validBody,
      attribution: sanitizeAttribution(completeAttribution),
    },
    { fromEmail: env.CONTACT_FROM_EMAIL, toEmail: env.CONTACT_TO_EMAIL },
  );
  assert.match(full.html, /Lead attribution/);
  assert.match(full.text, /CTA location: service/);
  assert.match(full.text, /Referring origin: https:\/\/www\.google\.com\/search/);
});

test("delivered inquiry keeps fixed recipient/reply-to and unchanged security controls", async () => {
  const mock = fetchMock();
  const poisoned = {
    ...validBody,
    attribution: {
      ...completeAttribution,
      toEmail: "attacker@evil.example",
      reply_to: "attacker@evil.example",
      from: "attacker@evil.example",
    },
  };
  const response = await handleContactRequest(request(poisoned), env, mock);
  assert.equal(response.status, 200);
  assert.equal(mock.calls.length, 2);
  assert.match(mock.calls[0].url, /siteverify/);
  assert.equal(
    mock.calls[1].init.headers["Idempotency-Key"],
    `contact/${validBody.submissionId}`,
  );
  const emailBody = JSON.parse(mock.calls[1].init.body);
  assert.equal(emailBody.reply_to, validBody.email);
  assert.deepEqual(emailBody.to, [env.CONTACT_TO_EMAIL]);
  assert.equal(emailBody.from, env.CONTACT_FROM_EMAIL);
  assert.match(emailBody.html, /Lead attribution/);
  assert.match(emailBody.text, /UTM source: newsletter/);
});

test("client CTA coverage helpers encode distinct surfaces", async () => {
  // Lightweight source checks (no TS import) — anchors used by CTAs.
  const { readFile } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");

  const button = await readFile(join(root, "src/components/Button.tsx"), "utf8");
  assert.match(button, /noteInquiryCta/);
  assert.match(button, /withContactAttribution/);

  const form = await readFile(join(root, "src/components/ContactForm.tsx"), "utf8");
  assert.match(form, /collectLeadAttribution/);
  assert.match(form, /attribution:/);

  const privacy = await readFile(join(root, "src/app/privacy/page.tsx"), "utf8");
  assert.match(privacy, /internal attribution note/i);
  assert.match(privacy, /Google Analytics 4 is\s+not enabled/i);
  assert.doesNotMatch(privacy, /GA4 is enabled/);

  const leadLib = await readFile(join(root, "src/lib/lead-attribution.ts"), "utf8");
  assert.match(leadLib, /no cookies or\s+localStorage/i);
  assert.doesNotMatch(leadLib, /localStorage\.(set|get)Item/);
  assert.doesNotMatch(leadLib, /document\.cookie/);
});
