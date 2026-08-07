import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@/components/Accordion";
import { ButtonA, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { InquiryCtaBand } from "@/components/InquiryCtaBand";
import { PageBackground } from "@/components/PageBackground";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { caseStudies } from "@/lib/case-studies";
import {
  FULL_LAUNCH_INCLUDES,
  PACKAGES,
  SERVICE_DELIVERABLES,
  SERVICE_DEPENDENCIES,
  SERVICE_EXCLUSIONS,
  SERVICE_FAQS,
  SERVICE_LANDING_DESCRIPTION,
  SERVICE_LANDING_PATH,
  SERVICE_LANDING_TITLE,
  SERVICE_LOCAL_CONTEXT,
  SERVICE_PROCESS,
  SERVICE_WHO_DOES_NOT_FIT,
  SERVICE_WHO_FITS,
} from "@/lib/service-landing";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

const pageUrl = `${SITE_URL}${SERVICE_LANDING_PATH}`;

export const metadata: Metadata = {
  title: "Website design for Vancouver Island",
  description: SERVICE_LANDING_DESCRIPTION,
  alternates: { canonical: SERVICE_LANDING_PATH },
  openGraph: {
    ...defaultOpenGraph,
    title: `${SERVICE_LANDING_TITLE} — EuroDigital`,
    description: SERVICE_LANDING_DESCRIPTION,
    url: pageUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SERVICE_LANDING_TITLE} — EuroDigital`,
    description: SERVICE_LANDING_DESCRIPTION,
  },
};

export default function VancouverIslandWebsiteDesignPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SERVICE_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SERVICE_LANDING_TITLE,
    description: SERVICE_LANDING_DESCRIPTION,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "EuroDigital",
      url: SITE_URL,
    },
    about: {
      "@type": "Service",
      name: "Small business website launch",
      provider: {
        "@type": "Organization",
        name: "EuroDigital",
        url: SITE_URL,
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Vancouver Island",
      },
      serviceType: "Website design and launch",
    },
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
          eyebrow="Vancouver Island"
          title={SERVICE_LANDING_TITLE}
          subtitle={SERVICE_LANDING_DESCRIPTION}
          divider={false}
        >
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href="/#contact"
              analyticsLocation="service"
              analyticsLabel="Request a project estimate"
            >
              Request a project estimate
            </ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              See live portfolio work
            </ButtonLink>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-600">
            One substantial service page for Island buyers — not a set of thin
            city doorway pages. Prices and package language match the offers
            already published on the homepage.
          </p>
        </Section>

        <Section
          eyebrow="Fit"
          title="Who this offer is for — and who it is not."
          subtitle="A useful website launch starts with an honest fit conversation."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Good fit</h2>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700">
                {SERVICE_WHO_FITS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">
                Usually not a fit
              </h2>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700">
                {SERVICE_WHO_DOES_NOT_FIT.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        <Section
          id="packages"
          eyebrow="Packages"
          title="Starting prices from the published EuroDigital offers."
          subtitle="These are the same package names and prices already used on the homepage. You receive written deliverables before work starts."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {PACKAGES.map((pkg, idx) => (
              <Reveal key={pkg.name} delay={0.03 * idx}>
                <Card
                  className={[
                    "flex h-full flex-col p-6 sm:p-8",
                    "highlight" in pkg && pkg.highlight
                      ? "ring-1 ring-indigo-500/25"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {pkg.name}
                    </h2>
                    {"badge" in pkg && pkg.badge ? (
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {pkg.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-base font-semibold text-slate-900">
                    {pkg.price}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {pkg.bestFor}
                  </p>
                  <ul className="mt-5 grid flex-1 gap-2 text-sm text-slate-800">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {"excludesNote" in pkg && pkg.excludesNote ? (
                    <p className="mt-5 text-xs leading-relaxed text-slate-500">
                      {pkg.excludesNote}
                    </p>
                  ) : null}
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 text-sm leading-relaxed text-slate-700">
            <strong className="font-semibold text-slate-900">
              Business Website and Online Store essentials:
            </strong>{" "}
            {FULL_LAUNCH_INCLUDES.join(" · ")}
          </div>
        </Section>

        <Section
          eyebrow="Scope"
          title="Deliverables, exclusions, and dependencies."
          subtitle="A clean launch depends on clear edges — what is included, what is not, and what you need to provide."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Deliverables
              </h2>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {SERVICE_DELIVERABLES.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Exclusions
              </h2>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {SERVICE_EXCLUSIONS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Dependencies
              </h2>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {SERVICE_DEPENDENCIES.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        <Section
          eyebrow="Local context"
          title="What Vancouver Island buyers usually need from a website."
          subtitle="Useful local context without stuffing a separate thin page for every town."
        >
          <div className="grid gap-4">
            {SERVICE_LOCAL_CONTEXT.map((item, idx) => (
              <Reveal key={item} delay={0.03 * idx}>
                <Card className="p-6 text-sm leading-relaxed text-slate-700">
                  {item}
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Proof"
          title="Inspect case studies with relationship context."
          subtitle="Claims stay limited to implementation and live proof. Relationship disclosures are explicit on each page."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {caseStudies.map((study) => (
              <Card key={study.slug} className="flex h-full flex-col p-6 sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {study.relationship.label}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {study.projectName}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
                  {study.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href={study.path}>
                    Read {study.projectName} case study
                  </ButtonLink>
                  <ButtonA
                    href={study.liveProof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                  >
                    Open live {study.projectName}
                  </ButtonA>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-700 underline-offset-4 hover:underline"
            >
              Browse the full portfolio index
            </Link>
          </div>
        </Section>

        <Section
          eyebrow="Process"
          title="From first message to launch — without the fog."
          subtitle="Fixed scope, visible milestones, honest dependencies, and a handoff you can actually use."
        >
          <div className="grid gap-4 lg:grid-cols-4">
            {SERVICE_PROCESS.map((step, idx) => (
              <Reveal key={step.title} delay={0.03 * idx}>
                <Card className="p-6">
                  <div className="text-base font-semibold text-slate-900">
                    {step.title}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-700">
                    {step.body}
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section
          id="faq"
          eyebrow="FAQ"
          title="Genuine buyer questions before you inquire."
        >
          <div className="max-w-3xl">
            <Accordion items={SERVICE_FAQS} />
          </div>
        </Section>

        <Section eyebrow="Inquire" title="Ready to talk about a launch?">
          <InquiryCtaBand
            title="Request a project estimate"
            body="Tell me what your business does, who it serves, and what the website needs to help customers do. I usually reply within 1–2 business days with fit, likely scope, and the next information needed for a written estimate."
            analyticsLocation="service"
            secondaryHref="/projects/maestrosservices"
            secondaryLabel="Start with a case study"
          />
        </Section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
