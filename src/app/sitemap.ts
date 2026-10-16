import type { MetadataRoute } from "next";
import { BLOG_PATHS } from "@/lib/blog";
import { CASE_STUDY_PATHS } from "@/lib/case-studies";
import { ADDITIONAL_SERVICE_PATHS } from "@/lib/service-pages";
import { SERVICE_LANDING_PATH } from "@/lib/service-landing";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      // Match the live homepage canonical (no trailing slash).
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${SERVICE_LANDING_PATH}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...ADDITIONAL_SERVICE_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...BLOG_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    {
      url: `${SITE_URL}/projects`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...CASE_STUDY_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
