import type { Metadata } from "next";
import type { ServiceLandingContent } from "@/lib/service-landing-types";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

export function servicePageMetadata(
  content: ServiceLandingContent,
): Metadata {
  const pageUrl = `${SITE_URL}${content.path}`;
  return {
    title: content.metaTitle,
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
