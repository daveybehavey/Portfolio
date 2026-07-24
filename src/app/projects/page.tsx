import type { Metadata } from "next";
import Image from "next/image";
import { ButtonA, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { PageBackground } from "@/components/PageBackground";
import { SiteFooter } from "@/components/SiteFooter";
import { projects } from "@/lib/projects";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

const pageUrl = `${SITE_URL}/projects`;

const portfolioDescription =
  "Live EuroDigital work — service and brand websites, working ecommerce stores, and side projects like NoteBill.";

export const metadata: Metadata = {
  title: "Portfolio",
  description: portfolioDescription,
  alternates: { canonical: "/projects" },
  openGraph: {
    ...defaultOpenGraph,
    title: "Portfolio — EuroDigital",
    description: portfolioDescription,
    url: pageUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio — EuroDigital",
    description: portfolioDescription,
  },
};

const featuredProjects = projects.filter((p) => p.isFeatured);
const notebill = projects.find((p) => p.name === "NoteBill");
const otherProjects = projects.filter(
  (p) => !p.isFeatured && p.name !== "NoteBill",
);

export default function ProjectsPage() {
  const [leadExample, secondExample] = featuredProjects;

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
          eyebrow="Portfolio"
          title="Live websites for real small businesses."
          subtitle="Local service sites, creative brands, ecommerce stores, early work, and side projects — including working online stores, not just brochure sites."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredProjects.map((project, idx) => (
              <Reveal key={project.name} delay={0.03 * idx}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>

          {leadExample && secondExample ? (
            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 text-sm leading-relaxed text-slate-700">
              <strong className="font-semibold text-slate-900">
                Core positioning:
              </strong>{" "}
              projects like {leadExample.name} and {secondExample.name} show
              lead-gen and brand launches; StarMapCo below is an example of a
              working ecommerce storefront with products and checkout.
            </div>
          ) : null}
        </Section>

        <Section
          eyebrow="More builds"
          title="Storefronts, early work, and other launches."
          subtitle="Each card links to the live site — portfolios should age with the internet, not against it."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {otherProjects.map((project, idx) => (
              <Reveal key={project.name} delay={0.03 * idx}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </Section>

        {notebill ? (
          <Section
            eyebrow="Side project"
            title="NoteBill — shipped separately from the main offer."
            subtitle="Proof I can build and launch software when needed — not what EuroDigital sells day to day."
          >
            <Reveal>
              <Card className="overflow-hidden">
                <div className="grid gap-0 lg:grid-cols-2">
                  <div className="relative min-h-[280px]">
                    <Image
                      src={notebill.imageSrc}
                      alt={`${notebill.name} preview`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 38rem, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
                    {notebill.playStoreUrl ? (
                      <a
                        href={notebill.playStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-md transition hover:bg-white/35"
                      >
                        Google Play
                      </a>
                    ) : null}
                  </div>
                  <div className="p-7 sm:p-8">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      {notebill.label}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {notebill.name}
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-slate-700">
                      {notebill.outcome}
                    </p>
                    <div className="mt-5 grid gap-2 text-sm text-slate-800">
                      {notebill.bullets.map((bullet) => (
                        <div key={bullet} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {notebill.playStoreUrl ? (
                        <ButtonA
                          href={notebill.playStoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get on Google Play
                        </ButtonA>
                      ) : null}
                      <ButtonA
                        href={notebill.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="secondary"
                      >
                        notebill.app
                      </ButtonA>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          </Section>
        ) : null}

        <Section
          eyebrow="Next step"
          title="If this feels like the kind of launch you need, say hello."
        >
          <Card className="p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-medium text-slate-600">
                  Website launch, essentials included, tidy handoff.
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Tell me what your business does — I will suggest a package and
                  realistic timeline.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/#contact">Contact</ButtonLink>
                <ButtonLink href="/#packages" variant="secondary">
                  Packages
                </ButtonLink>
              </div>
            </div>
          </Card>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
