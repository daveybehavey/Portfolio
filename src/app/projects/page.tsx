import type { Metadata } from "next";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";
import { ButtonA, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { projects } from "@/lib/projects";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

const pageUrl = `${SITE_URL}/projects`;

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Browse EuroDigital projects — NoteBill on Google Play, StarMapCo, and Vancouver Island client sites built for real leads.",
  alternates: { canonical: "/projects" },
  openGraph: {
    ...defaultOpenGraph,
    title: "Portfolio — EuroDigital",
    description:
      "Browse EuroDigital projects — NoteBill on Google Play, StarMapCo, and Vancouver Island client sites built for real leads.",
    url: pageUrl
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio — EuroDigital",
    description:
      "Browse EuroDigital projects — NoteBill on Google Play, StarMapCo, and Vancouver Island client sites built for real leads."
  }
};

const [featuredProject, ...otherProjects] = projects;

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="bg-mesh" aria-hidden />
      <div className="noise" aria-hidden />

      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition focus:translate-y-0 focus:opacity-100"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/78 shadow-[0_1px_0_0_rgba(255,255,255,0.65)_inset] shadow-sm shadow-slate-900/[0.04] backdrop-blur-md ring-1 ring-slate-900/[0.02] supports-[backdrop-filter]:bg-white/68">
        <Container>
          <div className="flex min-h-14 items-center justify-between gap-4 py-2.5 sm:min-h-[4.25rem] sm:py-3">
            <BrandLogo />
            <div className="flex items-center gap-2">
              <ButtonLink href="/" variant="secondary" className="nav-link-header">
                Home
              </ButtonLink>
              <ButtonLink href="/#contact" className="nav-link-header">
                Contact
              </ButtonLink>
            </div>
          </div>
        </Container>
      </header>

      <main id="main-content" tabIndex={-1} className="outline-none">
        <Section
          titleAs="h1"
          eyebrow="Portfolio"
          title="Every project in one place."
          subtitle="The homepage keeps the hero proof tight — especially NoteBill — while this page is the full tour for anyone who wants to see breadth, craft, and range in one scroll."
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <Card className="overflow-hidden">
                <div className="grid gap-0 lg:grid-cols-2">
                  <div className="relative min-h-[280px]">
                    <Image
                      src={featuredProject.imageSrc}
                      alt={`${featuredProject.name} preview`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 38rem, 100vw"
                      priority
                      fetchPriority="high"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
                    {featuredProject.playStoreUrl ? (
                      <a
                        href={featuredProject.playStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-md transition hover:bg-white/35"
                      >
                        Google Play
                      </a>
                    ) : null}
                  </div>
                  <div className="p-7 sm:p-8">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Featured app</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">NoteBill</h2>
                    <p className="mt-4 text-sm leading-relaxed text-slate-700">{featuredProject.outcome}</p>
                    <div className="mt-5 grid gap-2 text-sm text-slate-800">
                      {featuredProject.bullets.map((bullet) => (
                        <div key={bullet} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {featuredProject.playStoreUrl ? (
                        <ButtonA href={featuredProject.playStoreUrl} target="_blank" rel="noopener noreferrer">
                          Get on Google Play
                        </ButtonA>
                      ) : null}
                      <ButtonA href={featuredProject.url} target="_blank" rel="noopener noreferrer" variant="secondary">
                        notebill.app
                      </ButtonA>
                      <ButtonLink href="/#contact" variant="secondary">
                        Hire me
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>

            <Reveal delay={0.05} className="lg:col-span-5">
              <Card className="p-7 sm:p-8">
                <div className="text-sm font-medium text-slate-600">What you will find here</div>
                <div className="mt-3 grid gap-3">
                  {[
                    "Space to show variety without crowding the homepage story.",
                    "Proof that I can move between apps, storefronts, and local lead sites.",
                    "A candid, current snapshot of what is live today — not a greatest-hits fiction."
                  ].map((item, idx) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm shadow-slate-900/[0.04]"
                    >
                      <span
                        className={[
                          "mt-2 h-2 w-2 shrink-0 rounded-full",
                          idx % 2 === 0 ? "bg-indigo-600" : "bg-teal-600"
                        ].join(" ")}
                      />
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700">
                  New launches land here first — expect NoteBill and StarMapCo to keep earning fresh detail as they grow.
                </div>
              </Card>
            </Reveal>
          </div>
        </Section>

        <Section
          eyebrow="All projects"
          title="More builds worth a closer look."
          subtitle="Each card links out to the live experience — because portfolios should age with the internet, not against it."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {otherProjects.map((project, idx) => (
              <Reveal key={project.name} delay={0.03 * idx}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </Section>

        <Section eyebrow="Next step" title="If this feels like the kind of build you need, say hello.">
          <Card className="p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-medium text-slate-600">Scoped work, launch support, tidy handoff.</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Tell me what you are trying to ship — I will map a realistic path and timeline.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/#contact">Contact</ButtonLink>
                <ButtonLink href="/#services" variant="secondary">
                  Services
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
