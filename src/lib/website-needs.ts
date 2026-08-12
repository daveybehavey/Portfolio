/**
 * Interactive website-needs configurator — recommendation mapping only.
 * Not a quote engine. Prices mirror publicly published starting points in offer.ts.
 */

export const CONTACT_PROJECT_TYPES = [
  { value: "", label: "Choose the closest fit" },
  { value: "small-repair", label: "Small website repair / cleanup" },
  { value: "one-page", label: "One-Page Launch" },
  { value: "business-website", label: "Business Website" },
  { value: "online-store", label: "Online Store" },
  { value: "custom", label: "Custom Project" },
  { value: "unsure", label: "Not sure yet" },
] as const;

export type ContactProjectTypeValue =
  (typeof CONTACT_PROJECT_TYPES)[number]["value"];

export type SitePresence = "existing" | "none";

export type NeedFocus =
  | "fixes"
  | "outdated"
  | "leads"
  | "sales"
  | "new-site"
  | "custom";

export type WebsiteNeedRecommendation = {
  id: string;
  title: string;
  startingAround: string;
  summary: string;
  fitNote: string;
  projectType: Exclude<ContactProjectTypeValue, "">;
  ctaLabel: string;
  disclaimer: string;
};

const DISCLAIMER =
  "Recommendation only — not a binding quote. Scope, platform, and access still determine the written estimate.";

export const SITE_PRESENCE_OPTIONS = [
  {
    value: "existing" as const,
    label: "I already have a website",
    hint: "Repairs, refresh, or replacement",
  },
  {
    value: "none" as const,
    label: "I need a new website",
    hint: "Starting from scratch or replacing something unusable",
  },
] as const;

export const NEED_FOCUS_OPTIONS: Record<
  SitePresence,
  ReadonlyArray<{ value: NeedFocus; label: string; hint: string }>
> = {
  existing: [
    {
      value: "fixes",
      label: "A few things need fixing",
      hint: "Copy, links, layout tweaks, contact path",
    },
    {
      value: "outdated",
      label: "It looks outdated",
      hint: "Presentation and trust need a real upgrade",
    },
    {
      value: "leads",
      label: "I need more leads",
      hint: "Clearer services, trust, and call / quote paths",
    },
    {
      value: "sales",
      label: "I need online sales",
      hint: "Products, cart, checkout, payments",
    },
    {
      value: "new-site",
      label: "I need a new site",
      hint: "Rebuild around how customers actually buy",
    },
    {
      value: "custom",
      label: "Something custom",
      hint: "Booking, migrations, unusual scope",
    },
  ],
  none: [
    {
      value: "new-site",
      label: "I need a simple new site",
      hint: "One credible starting page may be enough",
    },
    {
      value: "leads",
      label: "I need more local leads",
      hint: "Multi-page service site that earns inquiries",
    },
    {
      value: "sales",
      label: "I need online sales",
      hint: "A working storefront, not just a gallery",
    },
    {
      value: "custom",
      label: "Something custom",
      hint: "Booking, subscriptions, migrations, mixed scope",
    },
  ],
};

export function isContactProjectType(
  value: string | null | undefined,
): value is Exclude<ContactProjectTypeValue, ""> {
  if (!value) return false;
  return CONTACT_PROJECT_TYPES.some(
    (entry) => entry.value !== "" && entry.value === value,
  );
}

export function recommendWebsiteNeed(
  presence: SitePresence,
  focus: NeedFocus,
): WebsiteNeedRecommendation {
  if (presence === "existing" && focus === "fixes") {
    return {
      id: "small-repair",
      title: "Small Website Repairs",
      startingAround: "Likely starting around $125 CAD",
      summary:
        "Targeted fixes on the site you already have — without turning a narrow problem into a rebuild.",
      fitNote:
        "Best when a few concrete improvements are enough. A full refresh is priced as a launch package instead.",
      projectType: "small-repair",
      ctaLabel: "Request a small repair",
      disclaimer: DISCLAIMER,
    };
  }

  if (focus === "sales") {
    return {
      id: "online-store",
      title: "Online Store",
      startingAround: "Starting around $2,000 CAD",
      summary:
        "A working storefront with products, checkout, payments, and a practical operating handoff.",
      fitNote:
        "Choose this when customers should be able to buy online — not when you only need a brochure site.",
      projectType: "online-store",
      ctaLabel: "Request a store estimate",
      disclaimer: DISCLAIMER,
    };
  }

  if (focus === "custom") {
    return {
      id: "custom",
      title: "Custom / scoped project",
      startingAround: "Quoted after a short discovery",
      summary:
        "Booking, migrations, multi-location content, integrations, or a mix that does not fit a standard launch.",
      fitNote:
        "You will get written deliverables and a price before any custom work starts.",
      projectType: "custom",
      ctaLabel: "Describe a custom project",
      disclaimer: DISCLAIMER,
    };
  }

  if (presence === "none" && focus === "new-site") {
    return {
      id: "one-page",
      title: "One-Page Launch",
      startingAround: "Starting around $499 CAD",
      summary:
        "One focused, mobile-friendly page with a clear offer and contact path — deliberately lean.",
      fitNote:
        "Strong when you need to get credible online quickly. Grow into a Business Website when pages and inquiry flow need more room.",
      projectType: "one-page",
      ctaLabel: "Request a one-page estimate",
      disclaimer: DISCLAIMER,
    };
  }

  // outdated, leads, new-site (existing), or none+leads → Business Website
  return {
    id: "business-website",
    title: "Business Website",
    startingAround: "Starting around $1,250 CAD",
    summary:
      "A complete multi-page site built to earn trust, explain services, and make the next step obvious.",
    fitNote:
      "The usual path for established local businesses. Includes stronger structure, inquiry flow, and launch setup.",
    projectType: "business-website",
    ctaLabel: "Request a Business Website estimate",
    disclaimer: DISCLAIMER,
  };
}

export function websiteNeedContactHref(
  projectType: Exclude<ContactProjectTypeValue, "">,
): string {
  const params = new URLSearchParams({ projectType });
  return `/?${params.toString()}#contact`;
}
