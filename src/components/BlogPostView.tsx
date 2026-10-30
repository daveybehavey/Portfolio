import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { InquiryCtaBand } from "@/components/InquiryCtaBand";
import { PageBackground } from "@/components/PageBackground";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import type { BlogPost } from "@/lib/blog";

export function BlogPostView({ post }: { post: BlogPost }) {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Person",
      name: "David Heslop",
    },
    publisher: {
      "@type": "Organization",
      name: "EuroDigital",
      url: "https://eurodigital.ca",
    },
    mainEntityOfPage: `https://eurodigital.ca${post.path}`,
  };

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
        <section className="relative py-16 sm:py-24 lg:py-28">
          <Container>
            <article className="mx-auto max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {post.eyebrow}
              </p>
              <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                {post.description}
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Published {post.publishedAt}
                {post.updatedAt ? ` · Updated ${post.updatedAt}` : ""} · David
                Heslop
              </p>

              <div className="mt-10 space-y-8">
                {post.sections.map((section, idx) => (
                  <section key={section.heading ?? `section-${idx}`}>
                    {section.heading ? (
                      <h2 className="text-xl font-semibold text-slate-900">
                        {section.heading}
                      </h2>
                    ) : null}
                    {section.paragraphs.map((paragraph, pIdx) => (
                      <p
                        key={`${section.heading ?? idx}-${pIdx}`}
                        className={`leading-relaxed text-slate-700 ${
                          section.heading || idx > 0 || pIdx > 0 ? "mt-3" : ""
                        }`}
                      >
                        {paragraph}
                      </p>
                    ))}
                    {section.list && section.list.length > 0 ? (
                      <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                        {section.list.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>

              {post.relatedLinks.length > 0 ? (
                <div className="mt-12">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Related
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {post.relatedLinks.map((link) => (
                      <ButtonLink
                        key={link.href}
                        href={link.href}
                        variant="secondary"
                      >
                        {link.label}
                      </ButtonLink>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="mt-10 text-sm text-slate-500">
                <Link
                  href="/blog"
                  className="font-medium text-indigo-700 underline-offset-4 hover:underline"
                >
                  ← All blog posts
                </Link>
              </p>
            </article>
          </Container>
        </section>

        <Section eyebrow="Inquire" title="Want this scoped for your business?">
          <InquiryCtaBand
            title="Request a project estimate"
            body="Tell me what your business does, what the site or Profile needs to help customers do, and whether you need a repair or a larger launch. I aim to reply within 1–2 business days with fit, likely scope, and the next information needed for a written estimate."
            analyticsLocation="blog"
            secondaryHref="/projects"
            secondaryLabel="Browse portfolio"
          />
        </Section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
    </div>
  );
}

export function BlogIndexCard({ post }: { post: BlogPost }) {
  return (
    <Card className="flex h-full flex-col p-6 sm:p-8">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {post.eyebrow}
      </div>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">
        <Link
          href={post.path}
          className="underline-offset-4 hover:underline"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
        {post.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{post.publishedAt}</span>
        <ButtonLink href={post.path} variant="secondary">
          Read post
        </ButtonLink>
      </div>
    </Card>
  );
}
