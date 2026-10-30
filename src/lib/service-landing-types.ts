import type { PACKAGES, SMALL_SITE_REPAIR } from "@/lib/offer";

export type ServicePackage = (typeof PACKAGES)[number];
export type SmallSiteRepair = typeof SMALL_SITE_REPAIR;

export type ServiceLandingContent = {
  path: `/${string}`;
  metaTitle: string;
  title: string;
  description: string;
  eyebrow: string;
  introNote: string;
  serviceType: string;
  /**
   * Explicit structured service geography for this page's Service schema.
   * Optional for the original Island hub pages (the renderer falls back to
   * Victoria + Vancouver Island); required by convention on city pages,
   * whose entries must come from the approved locality allowlist.
   */
  areaServed?: readonly {
    type: "City" | "AdministrativeArea";
    name: string;
  }[];
  whoFits: readonly string[];
  whoDoesNotFit: readonly string[];
  /** Longer practical sections that carry most of the useful local copy. */
  deepDive: {
    eyebrow: string;
    title: string;
    subtitle: string;
    blocks: readonly { heading: string; body: string }[];
  };
  deliverables: readonly string[];
  exclusions: readonly string[];
  dependencies: readonly string[];
  localContext: readonly string[];
  process: readonly { title: string; body: string }[];
  faqs: readonly { q: string; a: string }[];
  packagesMode: "all" | "store" | "business" | "repair" | "city" | "none";
  showCaseStudies: boolean;
  relatedLinks: readonly { href: string; label: string }[];
  cta: { title: string; body: string; secondaryHref?: string; secondaryLabel?: string };
};
