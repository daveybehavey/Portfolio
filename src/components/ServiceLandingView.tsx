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
  SMALL_SITE_REPAIR,
} from "@/lib/offer";
import type { ServiceLandingContent } from "@/lib/service-landing-types";
import { SITE_URL } from "@/lib/site";

function packagesForMode(mode: ServiceLandingContent["packagesMode"]) {
  if (mode === "none") return [];
  if (mode === "all") return [...PACKAGES];
  if (mode === "city") {
    // City pages show only the published launch offers. Custom Project is
    // deliberately excluded so a quoted-per-project engagement never reads
    // as a priced package; repairs still render separately below.
    return PACKAGES.filter((pkg) => pkg.name !== "Custom Project");
  }
  if (mode === "store") {
    return PACKAGES.filter(
      (pkg) => pkg.name === "Online Store" || pkg.name === "Custom Project",
    );
  }
  if (mode === "business") {
    return PACKAGES.filter(
      (pkg) =>
        pkg.name === "One-Page Launch" ||
        pkg.name === "Business Website" ||
        pkg.name === "Custom Project",
    );
  }
  return [];
}

export function ServiceLandingView({
  content,
}: {
  content: ServiceLandingContent;
}) {
  const pageUrl = `${SITE_URL}${content.path}`;
  const visiblePackages = packagesForMode(content.packagesMode);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((item) => ({
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
    name: content.title,
    description: content.description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "EuroDigital",
      url: SITE_URL,
    },
    about: {
      "@type": "Service",
      name: content.serviceType,
      provider: {
        "@type": "Organization",
        name: "EuroDigital",
        url: SITE_URL,
      },
      areaServed: content.areaServed
        ? content.areaServed.map((area) => ({
            "@type": area.type,
            name: area.name,
          }))
        : [
            { "@type": "City", name: "Victoria" },
            { "@type": "AdministrativeArea", name: "Vancouver Island" },
          ],
      serviceType: content.serviceType,
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
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.description}
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
            {content.introNote}
          </p>
        </Section>

        <Section
          eyebrow="Fit"
          title="Who this offer is for — and who it is not."
          subtitle="A useful engagement starts with an honest fit conversation."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Good fit</h2>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700">
                {content.whoFits.map((item) => (
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
                {content.whoDoesNotFit.map((item) => (
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
          eyebrow={content.deepDive.eyebrow}
          title={content.deepDive.title}
          subtitle={content.deepDive.subtitle}
        >
          <div className="grid gap-4">
            {content.deepDive.blocks.map((block, idx) => (
              <Reveal key={block.heading} delay={0.03 * idx}>
                <Card className="p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {block.heading}
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {block.body}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        {content.packagesMode === "repair" ? (
          <Section
            id="packages"
            eyebrow="Repair path"
            title="Small Website Repairs — when a rebuild is not the answer."
            subtitle="Published starting price for narrowly scoped work on a site you already have."
          >
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {SMALL_SITE_REPAIR.name}
                </h2>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                  {SMALL_SITE_REPAIR.badge}
                </span>
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {SMALL_SITE_REPAIR.price}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {SMALL_SITE_REPAIR.bestFor}
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-slate-800">
                {SMALL_SITE_REPAIR.examples.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-slate-500">
                {SMALL_SITE_REPAIR.excludesNote}
              </p>
              <div className="mt-6">
                <ButtonLink
                  href={SMALL_SITE_REPAIR.ctaHref}
                  analyticsLocation="service"
                  analyticsLabel={SMALL_SITE_REPAIR.ctaLabel}
                >
                  {SMALL_SITE_REPAIR.ctaLabel}
                </ButtonLink>
              </div>
            </Card>
            <p className="mt-6 text-sm leading-relaxed text-slate-600">
              If the right answer is a new site instead, the launch packages stay
              where they already are:{" "}
              <Link
                href="/#packages"
                className="font-medium text-indigo-700 underline-offset-2 hover:underline"
              >
                homepage packages
              </Link>{" "}
              and{" "}
              <Link
                href="/website-design-vancouver-island#packages"
                className="font-medium text-indigo-700 underline-offset-2 hover:underline"
              >
                Island website design
              </Link>
              .
            </p>
          </Section>
        ) : null}

        {visiblePackages.length > 0 ? (
          <Section
            id="packages"
            eyebrow="Packages"
            title="Starting prices from the published EuroDigital offers."
            subtitle="These are the same package names and prices already used on the homepage. You receive written deliverables before work starts."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {visiblePackages.map((pkg, idx) => (
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
            {content.packagesMode === "all" ||
            content.packagesMode === "business" ||
            content.packagesMode === "store" ||
            content.packagesMode === "city" ? (
              <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 text-sm leading-relaxed text-slate-700">
                <strong className="font-semibold text-slate-900">
                  Business Website and Online Store essentials:
                </strong>{" "}
                {FULL_LAUNCH_INCLUDES.join(" · ")}
              </div>
            ) : null}
            {content.packagesMode === "all" ||
            content.packagesMode === "city" ? (
              <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 text-sm leading-relaxed text-slate-700">
                <strong className="font-semibold text-slate-900">
                  {SMALL_SITE_REPAIR.name}:
                </strong>{" "}
                {SMALL_SITE_REPAIR.price} for narrowly scoped changes to an
                existing site. {SMALL_SITE_REPAIR.principle}{" "}
                <Link
                  href="/small-website-repairs"
                  className="font-medium text-indigo-700 underline-offset-2 hover:underline"
                >
                  Read the repairs page
                </Link>
                .
              </div>
            ) : null}
          </Section>
        ) : null}

        <Section
          eyebrow="Scope"
          title="Deliverables, exclusions, and dependencies."
          subtitle="Clear edges keep the work honest — what is included, what is not, and what you need to provide."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Deliverables
              </h2>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {content.deliverables.map((item) => (
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
                {content.exclusions.map((item) => (
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
                {content.dependencies.map((item) => (
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
          title="What Vancouver Island buyers usually need."
          subtitle="Useful local context without stuffing a separate thin page for every town."
        >
          <div className="grid gap-4">
            {content.localContext.map((item, idx) => (
              <Reveal key={item} delay={0.03 * idx}>
                <Card className="p-6 text-sm leading-relaxed text-slate-700">
                  {item}
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        {content.showCaseStudies ? (
          <Section
            eyebrow="Proof"
            title="Inspect case studies with relationship context."
            subtitle="Claims stay limited to implementation and live proof. Relationship disclosures are explicit on each page."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {caseStudies.map((study) => (
                <Card
                  key={study.slug}
                  className="flex h-full flex-col p-6 sm:p-8"
                >
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
        ) : null}

        <Section
          eyebrow="Process"
          title="From first message to handoff — without the fog."
          subtitle="Fixed scope, visible milestones, honest dependencies, and ownership you can actually use."
        >
          <div className="grid gap-4 lg:grid-cols-4">
            {content.process.map((step, idx) => (
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

        {content.relatedLinks.length > 0 ? (
          <Section
            eyebrow="Related"
            title="Other EuroDigital pages that often pair with this one."
          >
            <div className="flex flex-wrap gap-3">
              {content.relatedLinks.map((link) => (
                <ButtonLink key={link.href} href={link.href} variant="secondary">
                  {link.label}
                </ButtonLink>
              ))}
            </div>
          </Section>
        ) : null}

        <Section
          id="faq"
          eyebrow="FAQ"
          title="Genuine buyer questions before you inquire."
        >
          <div className="max-w-3xl">
            <Accordion items={[...content.faqs]} />
          </div>
        </Section>

        <Section eyebrow="Inquire" title={content.cta.title}>
          <InquiryCtaBand
            title={content.cta.title}
            body={content.cta.body}
            analyticsLocation="service"
            secondaryHref={content.cta.secondaryHref ?? "/projects"}
            secondaryLabel={content.cta.secondaryLabel ?? "Browse portfolio"}
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
