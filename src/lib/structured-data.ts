import { SITE_URL } from "@/lib/site";

/**
 * Shared Open Graph / Twitter image already published on the root layout.
 * Values are copied character-for-character from `src/app/layout.tsx`.
 */
export const SITE_SHARE_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "EuroDigital — Small business website launches",
} as const;

/**
 * BreadcrumbList JSON-LD. Callers must pass `name` strings that already exist
 * on the site (nav labels, page titles, or established breadcrumb copy).
 */
export function breadcrumbListJsonLd(
  items: readonly { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item:
        item.path === "/"
          ? SITE_URL
          : item.path.startsWith("http")
            ? item.path
            : `${SITE_URL}${item.path}`,
    })),
  };
}
