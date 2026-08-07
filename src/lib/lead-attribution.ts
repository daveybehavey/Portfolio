/**
 * Client-side lead attribution capture for contact inquiries.
 *
 * Uses URL parameters and in-memory module state only — no cookies or localStorage.
 * CTA query params on contact links survive full reloads when present.
 *
 * Server-side sanitization in server/lead-attribution.mjs is authoritative.
 */

import type { AnalyticsLocation } from "@/lib/analytics";

export type LeadAttribution = {
  pagePath?: string;
  landingPath?: string;
  ctaLabel?: string;
  ctaLocation?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
};

const CTA_PARAM = "ed_cta";
const CTA_LOCATION_PARAM = "ed_loc";

type SessionState = {
  landingPath: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  ctaLabel: string | null;
  ctaLocation: string | null;
  pagePath: string | null;
};

const session: SessionState = {
  landingPath: null,
  referrer: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  ctaLabel: null,
  ctaLocation: null,
  pagePath: null,
};

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function readParam(params: URLSearchParams, key: string, max: number): string {
  const raw = params.get(key);
  if (!raw) return "";
  return truncate(raw.replace(/\s+/g, " ").trim(), max);
}

/** True when href targets the homepage contact section. */
export function isContactHref(href: string): boolean {
  if (!href) return false;
  try {
    if (href.startsWith("#")) {
      return href === "#contact" || href.startsWith("#contact?");
    }
    const url = new URL(href, "https://eurodigital.ca");
    const path = normalizePathname(url.pathname);
    return path === "/" && url.hash.replace(/^#/, "").startsWith("contact");
  } catch {
    return href.includes("#contact");
  }
}

/**
 * Build a homepage contact href with optional CTA attribution query params.
 * Always targets `/` + `#contact` so the form location stays consistent.
 */
export function buildContactHref(options?: {
  ctaLabel?: string;
  ctaLocation?: AnalyticsLocation;
}): string {
  const params = new URLSearchParams();
  if (options?.ctaLabel) {
    params.set(CTA_PARAM, truncate(options.ctaLabel.trim(), 120));
  }
  if (options?.ctaLocation) {
    params.set(CTA_LOCATION_PARAM, options.ctaLocation);
  }
  const query = params.toString();
  return query ? `/?${query}#contact` : "/#contact";
}

/**
 * Ensure a contact-destined href carries CTA attribution when known.
 */
export function withContactAttribution(
  href: string,
  options?: { ctaLabel?: string; ctaLocation?: AnalyticsLocation },
): string {
  if (!isContactHref(href)) return href;
  if (!options?.ctaLabel && !options?.ctaLocation) {
    return href === "#contact" ? "/#contact" : href;
  }
  return buildContactHref({
    ctaLabel: options.ctaLabel,
    ctaLocation: options.ctaLocation,
  });
}

/** Record an intentional inquiry CTA click (in-memory). */
export function noteInquiryCta(options: {
  label: string;
  location: AnalyticsLocation;
}): void {
  const label = options.label.replace(/\s+/g, " ").trim();
  if (label) session.ctaLabel = truncate(label, 120);
  session.ctaLocation = options.location;
}

/**
 * Observe the current URL: landing path (first view), UTMs, CTA params,
 * current path, and (once) document.referrer when external.
 */
export function observeLocation(options: {
  pathname: string;
  search: string;
  documentReferrer?: string;
}): void {
  const pathname = normalizePathname(options.pathname || "/");
  session.pagePath = pathname;

  if (session.landingPath === null) {
    session.landingPath = pathname;
  }

  const params = new URLSearchParams(
    options.search.startsWith("?") ? options.search.slice(1) : options.search,
  );

  const utmSource = readParam(params, "utm_source", 100);
  const utmMedium = readParam(params, "utm_medium", 100);
  const utmCampaign = readParam(params, "utm_campaign", 100);
  const utmContent = readParam(params, "utm_content", 100);
  if (utmSource) session.utmSource = utmSource;
  if (utmMedium) session.utmMedium = utmMedium;
  if (utmCampaign) session.utmCampaign = utmCampaign;
  if (utmContent) session.utmContent = utmContent;

  const ctaLabel = readParam(params, CTA_PARAM, 120);
  const ctaLocation = readParam(params, CTA_LOCATION_PARAM, 40);
  if (ctaLabel) session.ctaLabel = ctaLabel;
  if (ctaLocation) session.ctaLocation = ctaLocation;

  if (session.referrer === null && options.documentReferrer) {
    // Store raw; server sanitizes. Cap length client-side only as a courtesy.
    const ref = options.documentReferrer.trim();
    if (ref) session.referrer = truncate(ref, 500);
  }
}

/** Snapshot for the contact JSON payload (optional fields only). */
export function collectLeadAttribution(): LeadAttribution {
  const attribution: LeadAttribution = {};

  if (session.pagePath) attribution.pagePath = session.pagePath;
  if (session.landingPath) attribution.landingPath = session.landingPath;
  if (session.ctaLabel) attribution.ctaLabel = session.ctaLabel;
  if (session.ctaLocation) attribution.ctaLocation = session.ctaLocation;
  if (session.utmSource) attribution.utmSource = session.utmSource;
  if (session.utmMedium) attribution.utmMedium = session.utmMedium;
  if (session.utmCampaign) attribution.utmCampaign = session.utmCampaign;
  if (session.utmContent) attribution.utmContent = session.utmContent;
  if (session.referrer) attribution.referrer = session.referrer;

  return attribution;
}

/** Test helper — reset in-memory session. */
export function resetLeadAttributionSessionForTests(): void {
  session.landingPath = null;
  session.referrer = null;
  session.utmSource = null;
  session.utmMedium = null;
  session.utmCampaign = null;
  session.utmContent = null;
  session.ctaLabel = null;
  session.ctaLocation = null;
  session.pagePath = null;
}
