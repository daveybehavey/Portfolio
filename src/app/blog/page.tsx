import type { Metadata } from "next";
import { BlogIndexCard } from "@/components/BlogPostView";
import { InquiryCtaBand } from "@/components/InquiryCtaBand";
import { PageBackground } from "@/components/PageBackground";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { blogPosts } from "@/lib/blog";
import {
  SITE_SHARE_IMAGE,
  breadcrumbListJsonLd,
} from "@/lib/structured-data";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

const title = "Blog — practical notes for Victoria & Vancouver Island businesses";
const description =
  "EuroDigital notes on website cost, Google Business Profile, redesign decisions, and related local web practice — written by David Heslop in Victoria, BC, without invented rankings or results.";

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    ...defaultOpenGraph,
    title: `${title} — EuroDigital`,
    description,
    url: `${SITE_URL}/blog`,
    images: [SITE_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} — EuroDigital`,
    description,
    images: [SITE_SHARE_IMAGE.url],
  },
};

export default function BlogIndexPage() {
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: title,
    description,
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "EuroDigital",
      url: SITE_URL,
    },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      url: `${SITE_URL}${post.path}`,
      author: {
        "@type": "Person",
        name: "David Heslop",
      },
    })),
  };

  const breadcrumbJsonLd = breadcrumbListJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ]);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <PageBackground />
      <SkipLink />
      <SiteHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 outline-none"
      >
        <Section
          titleAs="h1"
          eyebrow="Blog"
          title="Practical notes for Island businesses."
          subtitle={description}
          divider={false}
        >
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            Short, useful posts tied to the same published packages and service
            pages on eurodigital.ca. No invented statistics, testimonials, or
            ranking claims.
          </p>
        </Section>

        <Section eyebrow="Posts" title="Latest writing">
          <div className="grid gap-4 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <BlogIndexCard key={post.slug} post={post} />
            ))}
          </div>
        </Section>

        <Section eyebrow="Inquire" title="Need the work behind the notes?">
          <InquiryCtaBand
            title="Request a project estimate"
            body="Tell me what your business does and whether you need a repair, redesign, store, or Profile help. I aim to reply within 1–2 business days with fit, likely scope, and the next information needed for a written estimate."
            analyticsLocation="blog"
          />
        </Section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
