/** GA4 helpers — no-op when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset. */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export function isGaEnabled(): boolean {
  return /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
}

export type AnalyticsLocation =
  | "header"
  | "hero"
  | "packages"
  | "contact"
  | "footer"
  | "mobile_nav"
  | "sticky_bar"
  | "portfolio"
  | "privacy"
  | "service"
  | "case_study";

export type LeadMethod = "contact_form" | "mailto" | "mailto_direct";

export type LinkType = "anchor" | "route" | "mailto" | "external";

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || !isGaEnabled()) return;
  const w = window as Window & { gtag?: (...a: unknown[]) => void };
  w.gtag?.(...args);
}

export function classifyHref(href: string): LinkType {
  if (href.startsWith("mailto:")) return "mailto";
  if (href.startsWith("#")) return "anchor";
  if (href.startsWith("/")) return "route";
  return "external";
}

/** Custom event — all primary CTAs (recommended for funnel reporting). */
export function trackCtaClick(params: {
  label: string;
  location: AnalyticsLocation;
  href: string;
  linkType?: LinkType;
}) {
  const linkType = params.linkType ?? classifyHref(params.href);
  gtag("event", "cta_click", {
    cta_text: params.label.slice(0, 100),
    cta_location: params.location,
    link_url: params.href,
    link_type: linkType,
  });
}

/** GA4 recommended event — mailto or contact form (potential lead). */
export function trackGenerateLead(params: {
  method: LeadMethod;
  location: AnalyticsLocation;
}) {
  gtag("event", "generate_lead", {
    method: params.method,
    lead_location: params.location,
  });
}

export function trackCtaAndMaybeLead(params: {
  label: string;
  location: AnalyticsLocation;
  href: string;
}) {
  const linkType = classifyHref(params.href);
  trackCtaClick({ ...params, linkType });
  if (linkType === "mailto") {
    trackGenerateLead({
      method: params.href.includes("contact@") ? "mailto_direct" : "mailto",
      location: params.location,
    });
  }
}
