import type { Metadata } from "next";
import type { ServiceLandingContent } from "@/lib/service-landing-types";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

// The root layout applies a "%s — EuroDigital" title template to every
// page. Several content modules write metaTitle with the brand suffix
// already attached ("… — EuroDigital" / "… | EuroDigital"), which the
// template then appended a second time, rendering doubled titles such as
// "… — EuroDigital — EuroDigital". Strip one trailing brand suffix here,
// at the composition point, so the template supplies exactly one suffix
// and each page's own title text is left unchanged.
const TRAILING_BRAND_SUFFIX = /\s*[—|]\s*EuroDigital\s*$/;

export function servicePageMetadata(
  content: ServiceLandingContent,
): Metadata {
  const pageUrl = `${SITE_URL}${content.path}`;
  return {
    title: content.metaTitle.replace(TRAILING_BRAND_SUFFIX, ""),
    description: content.description,
    alternates: { canonical: content.path },
    openGraph: {
      ...defaultOpenGraph,
      title: `${content.title} — EuroDigital`,
      description: content.description,
      url: pageUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${content.title} — EuroDigital`,
      description: content.description,
    },
  };
}
