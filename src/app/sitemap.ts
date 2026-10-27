import type { MetadataRoute } from "next";
import { BLOG_PATHS, blogPosts } from "@/lib/blog";
import { CASE_STUDY_PATHS } from "@/lib/case-studies";
import { ADDITIONAL_SERVICE_PATHS } from "@/lib/service-pages";
import { SERVICE_LANDING_PATH } from "@/lib/service-landing";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // lastModified is only emitted where a real content date exists (blog
  // posts). Static pages have no per-page date, so they omit it rather than
  // stamping every URL with the build time.
  const blogLastmodByPath = new Map(
    blogPosts.map((post) => [
      post.path,
      new Date(post.updatedAt ?? post.publishedAt),
    ]),
  );
  return [
    {
      // Match the live homepage canonical (no trailing slash).
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${SERVICE_LANDING_PATH}`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...ADDITIONAL_SERVICE_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...BLOG_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: blogLastmodByPath.get(path),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    {
      url: `${SITE_URL}/projects`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...CASE_STUDY_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
