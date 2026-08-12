import Image from "next/image";
import Link from "next/link";
import { ButtonA, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { DeviceShowcase } from "@/components/DeviceShowcase";
import { InquiryCtaBand } from "@/components/InquiryCtaBand";
import { PageBackground } from "@/components/PageBackground";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import type { CaseStudy } from "@/lib/case-studies";
import { SERVICE_LANDING_PATH } from "@/lib/service-landing";
import { SITE_URL } from "@/lib/site";

const STORY_CHAPTERS = [
  { id: "problem", label: "Problem" },
  { id: "decisions", label: "Constraints" },
  { id: "responsive", label: "Responsive" },
  { id: "implementation", label: "Stack" },
  { id: "proof", label: "Live proof" },
] as const;

export function CaseStudyView({ study }: { study: CaseStudy }) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Portfolio",
        item: `${SITE_URL}/projects`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: study.projectName,
        item: `${SITE_URL}${study.path}`,
      },
    ],
  };

  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: study.title,
    description: study.description,
    url: `${SITE_URL}${study.path}`,
    about: study.projectName,
    creator: {
      "@type": "Organization",
      name: "EuroDigital",
      url: SITE_URL,
    },
    isBasedOn: study.liveProof.url,
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
        <Section
          titleAs="h1"
          eyebrow={study.eyebrow}
          title={study.title}
          subtitle={study.description}
          divider={false}
        >
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-600">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="font-medium text-slate-700 underline-offset-4 hover:underline"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-300">
                /
              </li>
              <li>
                <Link
                  href="/projects"
                  className="font-medium text-slate-700 underline-offset-4 hover:underline"
                >
                  Portfolio
                </Link>
              </li>
              <li aria-hidden className="text-slate-300">
                /
              </li>
              <li className="font-medium text-slate-900" aria-current="page">
                {study.projectName}
              </li>
            </ol>
          </nav>

          <div
            role="note"
            className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 text-sm leading-relaxed text-slate-800"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900/80">
              Relationship disclosure
            </div>
            <p className="mt-2">
              <strong className="font-semibold text-slate-900">
                {study.relationship.label}.
              </strong>{" "}
              {study.relationship.disclosure}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm">
            <div className="relative aspect-[16/9] w-full bg-slate-100">
              <Image
                src={study.imageSrc}
                alt={study.imageAlt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 960px, 100vw"
                priority
              />
            </div>
          </div>

          <nav
            aria-label="Case study chapters"
            className="mt-8 overflow-x-auto"
          >
            <ol className="flex min-w-max items-center gap-2 text-xs font-medium text-slate-600 sm:gap-3">
              {STORY_CHAPTERS.map((chapter, index) => (
                <li key={chapter.id} className="flex items-center gap-2 sm:gap-3">
                  <a
                    href={`#${chapter.id}`}
                    className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-slate-700 underline-offset-2 hover:border-indigo-200 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"
                  >
                    {chapter.label}
                  </a>
                  {index < STORY_CHAPTERS.length - 1 ? (
                    <span aria-hidden className="text-slate-300">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </Section>

        <Section
          id="problem"
          eyebrow="Problem"
          title="What needed to be solved."
          subtitle={study.problem}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div id="decisions" className="scroll-mt-28">
              <Card className="p-6">
                <h3 className="text-base font-semibold text-slate-900">
                  Constraints
                </h3>
                <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                  {study.constraints.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Implementation
              </h3>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {study.implementation.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        <Section
          id="responsive"
          eyebrow="Responsive proof"
          title="How it looks where customers browse."
          subtitle="Real live-site screenshots at desktop, tablet, and mobile widths — switch modes to compare."
        >
          <Reveal>
            <DeviceShowcase
              images={study.viewportImages}
              siteUrl={study.liveProof.url}
              projectName={study.projectName}
            />
          </Reveal>
        </Section>

        <Section
          id="implementation"
          eyebrow="Stack and operations"
          title="What was put in place."
          subtitle="Implementation accomplishments, not invented business outcomes."
        >
          <Reveal>
            <Card className="p-6 sm:p-8">
              <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                {study.stack.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </Section>

        <Section
          id="proof"
          eyebrow="Live proof"
          title="Inspect the working site."
          subtitle={study.liveProof.summary}
        >
          <div className="flex flex-wrap gap-3">
            <ButtonA
              href={study.liveProof.url}
              target="_blank"
              rel="noopener noreferrer"
              analyticsLocation="case_study"
              analyticsLabel={`Open live ${study.projectName}`}
            >
              Open live {study.projectName}
            </ButtonA>
            <ButtonLink href="/projects" variant="secondary">
              Back to portfolio
            </ButtonLink>
            <ButtonLink href={SERVICE_LANDING_PATH} variant="secondary">
              Vancouver Island website design
            </ButtonLink>
          </div>
        </Section>

        <Section
          eyebrow="Limitations"
          title="What this case study does not claim."
          subtitle="Useful proof stays useful by staying narrow."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Practical limits
              </h3>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {study.limitations.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Explicitly not claimed
              </h3>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {study.notClaimed.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        <Section eyebrow="Next step" title="If this is the kind of launch you need.">
          <InquiryCtaBand
            title="Tell me what your business needs to launch."
            body="Share what you do, who you serve, and what the website should help customers do. You will get a fit response and the next information needed for a written estimate."
            analyticsLocation="case_study"
            secondaryHref={SERVICE_LANDING_PATH}
            secondaryLabel="Read the service page"
          />
        </Section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }}
      />
    </div>
  );
}
