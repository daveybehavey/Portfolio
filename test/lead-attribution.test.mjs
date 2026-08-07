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
  assert.match(leadLib, /sanitizeClientReferrer/);
  assert.doesNotMatch(leadLib, /localStorage\.(set|get)Item/);
  assert.doesNotMatch(leadLib, /document\.cookie/);
  assert.doesNotMatch(leadLib, /truncate\(ref,\s*500\)/);
});

async function loadClientLeadAttribution() {
  const { readFile, mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath, pathToFileURL } = await import("node:url");
  const { tmpdir } = await import("node:os");
  const ts = await import("typescript");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const source = await readFile(
    join(root, "src/lib/lead-attribution.ts"),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: "lead-attribution.ts",
  });

  const dir = await mkdtemp(join(tmpdir(), "lead-attr-"));
  const outFile = join(dir, "lead-attribution.mjs");
  await writeFile(outFile, outputText, "utf8");
  try {
    return {
      mod: await import(pathToFileURL(outFile).href),
      cleanup: async () => {
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

test("sanitizeClientReferrer strips credentials, query, and fragment before transmission", async () => {
  const { mod, cleanup } = await loadClientLeadAttribution();
  try {
    const { sanitizeClientReferrer } = mod;
    assert.equal(
      sanitizeClientReferrer("https://example.com/path?q=secret#section"),
      "https://example.com/path",
    );
    assert.equal(
      sanitizeClientReferrer("https://user:pass@example.com/path?q=1#x"),
      "https://example.com/path",
    );
    assert.equal(sanitizeClientReferrer("javascript:alert(1)"), "");
    assert.equal(sanitizeClientReferrer("data:text/html,hi"), "");
    assert.equal(sanitizeClientReferrer("ftp://files.example/a"), "");
    assert.equal(sanitizeClientReferrer("not a url"), "");
    assert.equal(sanitizeClientReferrer(""), "");
  } finally {
    await cleanup();
  }
});

test("sanitizeClientReferrer normalizes slashes, drops unsafe paths to origin, and caps length", async () => {
  const { mod, cleanup } = await loadClientLeadAttribution();
  try {
    const { sanitizeClientReferrer } = mod;
    assert.equal(
      sanitizeClientReferrer("https://example.com//a//b/"),
      "https://example.com/a/b",
    );
    assert.equal(
      sanitizeClientReferrer("https://example.com/"),
      "https://example.com",
    );
    // Unsafe pathname characters → origin only (documented client/server rule).
    assert.equal(
      sanitizeClientReferrer("https://example.com/path<script>"),
      "https://example.com",
    );
    const longPath = `https://example.com/${"p".repeat(400)}`;
    const capped = sanitizeClientReferrer(longPath);
    assert.ok(capped.length <= 200);
    assert.match(capped, /^https:\/\/example\.com/);
    assert.doesNotMatch(capped, /\?|#|@/);
  } finally {
    await cleanup();
  }
});

test("observeLocation never stores raw referrer credentials, query, or fragment", async () => {
  const { mod, cleanup } = await loadClientLeadAttribution();
  try {
    const {
      observeLocation,
      collectLeadAttribution,
      resetLeadAttributionSessionForTests,
      sanitizeClientReferrer,
    } = mod;

    resetLeadAttributionSessionForTests();
    observeLocation({
      pathname: "/website-design-vancouver-island",
      search: "",
      documentReferrer: "https://user:secret@evil.example/landing?token=abc#frag",
    });
    const snapshot = collectLeadAttribution();
    assert.equal(snapshot.referrer, "https://evil.example/landing");
    assert.doesNotMatch(snapshot.referrer, /user:|secret|token=|frag|#|\?/);
    assert.equal(
      snapshot.referrer,
      sanitizeClientReferrer(
        "https://user:secret@evil.example/landing?token=abc#frag",
      ),
    );

    // Empty after sanitize → omit field entirely.
    resetLeadAttributionSessionForTests();
    observeLocation({
      pathname: "/",
      search: "",
      documentReferrer: "javascript:alert(1)",
    });
    assert.equal(collectLeadAttribution().referrer, undefined);
  } finally {
    await cleanup();
  }
});

test("client sanitizeClientReferrer matches server sanitizeReferrer outputs", async () => {
  const { mod, cleanup } = await loadClientLeadAttribution();
  try {
    const samples = [
      "https://example.com/path?q=secret#section",
      "https://user:pass@example.com/path?q=1#x",
      "javascript:alert(1)",
      "data:text/html,hi",
      "ftp://files.example/a",
      "not a url",
      "https://example.com//a//b/",
      "https://example.com/path<script>",
      "http://news.example/story/",
      `https://example.com/${"z".repeat(300)}`,
    ];
    for (const sample of samples) {
      assert.equal(
        mod.sanitizeClientReferrer(sample),
        sanitizeReferrer(sample),
        `mismatch for ${sample}`,
      );
    }
  } finally {
    await cleanup();
  }
});
