/**
 * Privacy-conscious lead attribution for contact inquiries.
 * Values are never used for auth, recipient selection, or security decisions.
 */

export const ATTRIBUTION_LIMITS = Object.freeze({
  pagePath: 200,
  landingPath: 200,
  ctaLabel: 120,
  ctaLocation: 40,
  utmSource: 100,
  utmMedium: 100,
  utmCampaign: 100,
  utmContent: 100,
  referrer: 200,
});

export const ALLOWED_CTA_LOCATIONS = Object.freeze([
  "header",
  "hero",
  "packages",
  "contact",
  "footer",
  "mobile_nav",
  "sticky_bar",
  "portfolio",
  "privacy",
  "service",
  "case_study",
]);

const ALLOWED_CTA_LOCATION_SET = new Set(ALLOWED_CTA_LOCATIONS);

/** Safe EuroDigital-style path: leading slash, limited charset, optional trailing slash. */
const SAFE_PATH_RE = /^\/[a-zA-Z0-9/_-]*$/;

const ATTRIBUTION_FIELD_KEYS = [
  "pagePath",
  "landingPath",
  "ctaLabel",
  "ctaLocation",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "referrer",
];

function normalizeWhitespace(value) {
  // Turn control characters into spaces, then collapse whitespace.
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, max) {
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Normalize a site-relative path. Returns "" when unsafe.
 */
export function sanitizePath(value, maxLength = ATTRIBUTION_LIMITS.pagePath) {
  if (typeof value !== "string") return "";
  let text = normalizeWhitespace(value);
  if (!text) return "";

  // Reject absolute URLs masquerading as paths.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text) || text.includes("://")) {
    return "";
  }

  // Drop query/hash if a client sent a fuller locator.
  const cut = text.search(/[?#]/);
  if (cut >= 0) text = text.slice(0, cut);

  if (!text.startsWith("/")) {
    text = `/${text}`;
  }

  // Collapse accidental duplicate slashes except leading.
  text = text.replace(/\/{2,}/g, "/");

  if (text.length > 1 && text.endsWith("/")) {
    text = text.slice(0, -1);
  }

  text = clamp(text, maxLength);
  if (!SAFE_PATH_RE.test(text)) return "";
  return text;
}

/**
 * Prefer origin + safe pathname. Strip credentials, fragments, and query.
 * Reject non-http(s) schemes.
 */
export function sanitizeReferrer(value, maxLength = ATTRIBUTION_LIMITS.referrer) {
  if (typeof value !== "string") return "";
  const text = normalizeWhitespace(value);
  if (!text) return "";

  let url;
  try {
    url = new URL(text);
  } catch {
    return "";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "";
  }

  url.username = "";
  url.password = "";
  url.hash = "";
  url.search = "";

  let path = url.pathname || "/";
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (!SAFE_PATH_RE.test(path) && path !== "/") {
    path = "/";
  }

  const rendered = `${url.origin}${path === "/" ? "" : path}`;
  return clamp(rendered, maxLength);
}

export function sanitizeUtm(value, maxLength) {
  if (typeof value !== "string") return "";
  return clamp(normalizeWhitespace(value), maxLength);
}

export function sanitizeCtaLabel(value, maxLength = ATTRIBUTION_LIMITS.ctaLabel) {
  if (typeof value !== "string") return "";
  return clamp(normalizeWhitespace(value), maxLength);
}

export function sanitizeCtaLocation(
  value,
  maxLength = ATTRIBUTION_LIMITS.ctaLocation,
) {
  if (typeof value !== "string") return "";
  const text = clamp(normalizeWhitespace(value), maxLength);
  return ALLOWED_CTA_LOCATION_SET.has(text) ? text : "";
}

/**
 * Allowlist and sanitize optional attribution. Unknown keys are ignored.
 * Wrong types / unsafe values are omitted (never fail the parent form).
 * @returns {Record<string, string>} possibly empty
 */
export function sanitizeAttribution(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const out = {};

  const pagePath = sanitizePath(input.pagePath, ATTRIBUTION_LIMITS.pagePath);
  if (pagePath) out.pagePath = pagePath;

  const landingPath = sanitizePath(
    input.landingPath,
    ATTRIBUTION_LIMITS.landingPath,
  );
  if (landingPath) out.landingPath = landingPath;

  const ctaLabel = sanitizeCtaLabel(input.ctaLabel);
  if (ctaLabel) out.ctaLabel = ctaLabel;

  const ctaLocation = sanitizeCtaLocation(input.ctaLocation);
  if (ctaLocation) out.ctaLocation = ctaLocation;

  const utmSource = sanitizeUtm(input.utmSource, ATTRIBUTION_LIMITS.utmSource);
  if (utmSource) out.utmSource = utmSource;

  const utmMedium = sanitizeUtm(input.utmMedium, ATTRIBUTION_LIMITS.utmMedium);
  if (utmMedium) out.utmMedium = utmMedium;

  const utmCampaign = sanitizeUtm(
    input.utmCampaign,
    ATTRIBUTION_LIMITS.utmCampaign,
  );
  if (utmCampaign) out.utmCampaign = utmCampaign;

  const utmContent = sanitizeUtm(input.utmContent, ATTRIBUTION_LIMITS.utmContent);
  if (utmContent) out.utmContent = utmContent;

  const referrer = sanitizeReferrer(input.referrer, ATTRIBUTION_LIMITS.referrer);
  if (referrer) out.referrer = referrer;

  // Explicitly ignore any other keys (incl. nested objects).
  for (const key of Object.keys(input)) {
    if (!ATTRIBUTION_FIELD_KEYS.includes(key)) {
      // ignored
    }
  }

  return out;
}

export function hasAttribution(attribution) {
  return Boolean(
    attribution &&
      typeof attribution === "object" &&
      Object.keys(attribution).length > 0,
  );
}

const EMAIL_LABELS = Object.freeze({
  pagePath: "Page path",
  landingPath: "Landing path",
  ctaLabel: "CTA label",
  ctaLocation: "CTA location",
  utmSource: "UTM source",
  utmMedium: "UTM medium",
  utmCampaign: "UTM campaign",
  utmContent: "UTM content",
  referrer: "Referring origin",
});

/**
 * Build plain-text and HTML fragments for the internal email section.
 * Returns null when there is nothing to report.
 */
export function buildAttributionEmailSection(attribution, escapeHtml) {
  if (!hasAttribution(attribution)) return null;

  const rows = [];
  for (const key of ATTRIBUTION_FIELD_KEYS) {
    const value = attribution[key];
    if (typeof value === "string" && value) {
      rows.push([EMAIL_LABELS[key], value]);
    }
  }
  if (rows.length === 0) return null;

  const text = [
    "",
    "Lead attribution",
    "(Internal — pages, CTAs, or campaign parameters associated with this inquiry.)",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<h2>Lead attribution</h2><p style="color:#475569;font-size:13px">Internal — pages, CTAs, or campaign parameters associated with this inquiry.</p><table>${htmlRows}</table>`;

  return { text, html };
}
