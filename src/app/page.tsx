import Image from "next/image";

import { Accordion } from "@/components/Accordion";

import { ButtonA, ButtonLink } from "@/components/Button";

import { Card } from "@/components/Card";

import { Container } from "@/components/Container";

import { ContactForm } from "@/components/ContactForm";

import { HeroCollage } from "@/components/HeroCollage";

import { HeroIntro } from "@/components/HeroIntro";

import { HeroSection } from "@/components/HeroSection";

import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { WhyChooseSection } from "@/components/WhyChooseSection";

import { ProjectCard } from "@/components/ProjectCard";

import { Reveal } from "@/components/Reveal";

import { Section } from "@/components/Section";

import { SiteFooter } from "@/components/SiteFooter";

import { FULL_LAUNCH_INCLUDES, PACKAGES, PROJECT_ARCHETYPES } from "@/lib/offer";

import { projects } from "@/lib/projects";

import { CONTACT_EMAIL, CONTACT_REPLY_NOTE } from "@/lib/site";

const homepageProjects = projects.filter(
  (p) => p.name === "StarMapCo" || p.name === "VancouverIslandProRoofing",
);

export default function Home() {
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
        <HeroSection>
          <Container>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
              <HeroIntro />

              <div className="lg:col-span-5">
                <Reveal delay={0.08}>
                  <HeroCollage
                    items={[
                      {
                        src: "/projects/maestrosservices.webp",
                        alt: "MaestrosServices website",
                        className: "col-span-7 aspect-[16/10]",
                      },
                      {
                        src: "/projects/angelkisscreations.webp",
                        alt: "AnglKissCreations website",
                        className: "col-span-5 aspect-[16/10]",
                      },
                      {
                        src: "/projects/starmapco.webp",
                        alt: "StarMapCo website",
                        className: "col-span-5 aspect-[16/10]",
                      },
                      {
                        src: "/projects/vancouverislandproroofing.webp",
                        alt: "Vancouver Island Pro Roofing website",
                        className: "col-span-7 aspect-[16/10]",
                      },
                    ]}
                  />

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { k: "Offer", v: "Website launch" },

                      { k: "Setup", v: "Google + email" },

                      { k: "Discover", v: "Basic SEO" },

                      { k: "Wrap-up", v: "You own it" },
                    ].map((item) => (
                      <Card
                        key={item.k}
                        className="p-4 transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                      >
                        <div className="text-xs font-medium text-slate-600">
                          {item.k}
                        </div>

                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {item.v}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </Container>
        </HeroSection>

        <Section
          id="examples"
          eyebrow="Who this is for"
          title="Three common launches — all setup included."
          subtitle="Local service sites, creative brand showcases, and full online stores. Pick the fit for your business; every package includes the essentials and a clear handoff."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {PROJECT_ARCHETYPES.map((archetype, idx) => (
              <Reveal key={archetype.id} delay={0.03 * idx}>
                <Card className="overflow-hidden transition-shadow duration-500 ease-out hover:shadow-xl hover:shadow-indigo-950/[0.08] motion-reduce:hover:shadow-md">
                  <div className="relative min-h-[220px] sm:min-h-[260px]">
                    <Image
                      src={archetype.imageSrc}
                      alt={`${archetype.example} website example`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 28rem, 100vw"
                      priority={idx === 0}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/15 to-transparent" />

                    <a
                      href={archetype.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-md transition hover:bg-white/35"
                    >
                      Live example
                    </a>
                  </div>

                  <div className="p-7 sm:p-8">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      {archetype.example}
                    </div>

                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                      {archetype.title}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                      {archetype.body}
                    </p>

                    <div className="mt-5">
                      <ButtonA
                        href={archetype.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="secondary"
                        magnetic
                      >
                        View {archetype.example}
                      </ButtonA>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section
          id="packages"
          eyebrow="Packages"
          title="Launches for websites and online stores"
          subtitle="From a bare one-pager with domain only, up to full stores. Starting prices below — final quote depends on scope. Most brochure launches land under $1k."
        >
          <div className="grid gap-4">
            <Reveal>
              <Card className="p-6 sm:p-7 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-600">
                      Full launch packages include
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      One-Page Essentials is domain + single page only — no Google or analytics
                      setup.
                    </p>
                    <ul className="mt-4 grid gap-2 text-sm text-slate-800 sm:grid-cols-2 lg:gap-x-8">
                      {FULL_LAUNCH_INCLUDES.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ButtonLink
                    href="/#contact"
                    className="w-full shrink-0 lg:w-auto"
                    magnetic
                    analyticsLocation="packages"
                    analyticsLabel="Request a quote"
                  >
                    Request a quote
                  </ButtonLink>
                </div>
              </Card>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {PACKAGES.map((pkg, idx) => (
                <Reveal
                  key={pkg.name}
                  delay={0.03 * idx}
                  className={"span" in pkg && pkg.span === "full" ? "sm:col-span-2" : undefined}
                >
                  <Card
                    className={[
                      "flex h-full flex-col p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                      "highlight" in pkg && pkg.highlight
                        ? "border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-white shadow-md shadow-indigo-950/[0.06]"
                        : "essentialsOnly" in pkg && pkg.essentialsOnly
                          ? "border-slate-200/90 bg-slate-50/40 hover:border-slate-300/80"
                          : "hover:border-indigo-200/55",
                    ].join(" ")}
                  >
                    {"badge" in pkg && pkg.badge ? (
                      <span className="mb-2 inline-flex w-fit rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                        {pkg.badge}
                      </span>
                    ) : null}

                    <div className="text-base font-semibold text-slate-900">
                      {pkg.name}
                    </div>

                    <div className="mt-1 text-sm font-medium text-indigo-700">
                      {pkg.price}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {pkg.bestFor}
                    </p>

                    {"excludesNote" in pkg && pkg.excludesNote ? (
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        {pkg.excludesNote}
                      </p>
                    ) : null}

                    <ul className="mt-4 flex-1 grid gap-2 text-sm text-slate-800">
                      {pkg.includes.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <ButtonLink
                        href="/#contact"
                        variant={
                          "highlight" in pkg && pkg.highlight
                            ? "primary"
                            : "secondary"
                        }
                        className="w-full text-sm"
                        magnetic={"highlight" in pkg && !!pkg.highlight}
                        analyticsLocation="packages"
                        analyticsLabel={`Get a quote — ${pkg.name}`}
                      >
                        Get a quote
                      </ButtonLink>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <WhyChooseSection />

        <Section
          id="work"
          eyebrow="More work"
          title="Live sites beyond the main examples."
          subtitle="The portfolio page has the full set — including side projects — when you want to browse everything."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Including a live ecommerce store (StarMapCo) and other client builds.
            </div>

            <ButtonLink href="/projects" variant="secondary">
              Open full portfolio
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {homepageProjects.map((project, idx) => (
              <Reveal key={project.name} delay={0.03 * idx}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </Section>

        <Section
          id="process"
          eyebrow="Process"
          title="From first message to launch — without the fog."
          subtitle="Fixed scope, visible milestones, and a handoff you can actually use. No mystery retainers unless we agree to something extra later."
        >
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              {
                t: "1) Discovery",

                d: "You share your business, goals, and a few references. I confirm fit, page count, and what a realistic launch covers.",
              },

              {
                t: "2) Plan",

                d: "We lock pages, contact paths, Google setup needs, and a timeline so the build does not sprawl mid-flight.",
              },

              {
                t: "3) Build",

                d: "Design and pages stay mobile-first and fast — services or products, trust sections, forms, and basic SEO structure.",
              },

              {
                t: "4) Launch & handoff",

                d: "Domain, hosting, email forwarding, Analytics, Search Console, checklist, and a walkthrough — you own the keys.",
              },
            ].map((step, idx) => (
              <Reveal key={step.t} delay={0.03 * idx}>
                <Card className="p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0">
                  <div className="text-base font-semibold text-slate-900">
                    {step.t}
                  </div>

                  <div className="mt-2 text-sm leading-relaxed text-slate-700">
                    {step.d}
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section id="faq" eyebrow="FAQ" title="Straight answers">
          <div className="max-w-3xl">
            <Accordion
              items={[
                {
                  q: "Are these prices fixed?",

                  a: "The site shows starting points. One-Page Essentials (single HTML/CSS/JS page, domain + hosting only) often lands around $299–$449. Starter and simple brochure sites often land in the $400–$700 range; Business and Brand launches often land around $850–$1,100 depending on pages and content. Ecommerce depends on product count and platform. You get a clear written quote before any work starts.",
                },

                {
                  q: "What is the bare minimum package?",

                  a: "One-Page Essentials: one lightweight page, domain and hosting hooked up, and your contact details on the page — no contact form, no Google Analytics, no Business Profile, no custom email setup. It is for people who literally just need to be findable online.",
                },

                {
                  q: "Is this a monthly marketing or IT retainer?",

                  a: "No — the core offer is a one-time website launch with setup and handoff. If you want ongoing help afterward, we will scope it separately so expectations stay clear.",
                },

                {
                  q: "Can you set up a full working ecommerce store?",

                  a: "Yes — that is what the Ecommerce Store Launch package is for: a real storefront with products, cart, checkout, and payments — not just a brochure site with photos. We pick a stack that fits your size (often avoiding Shopify’s ~$49 CAD/month Basic plan when you do not need it), configure payments and shipping basics, and walk you through products and orders before handoff.",
                },

                {
                  q: "Why not just use Shopify?",

                  a: "Shopify is excellent when you want their ecosystem and do not mind the monthly plan (Basic is about $49 CAD/month, or ~$37/mo on annual billing, per Shopify Canada — plus apps and themes). Many Island shops only need a straightforward store. EuroDigital can launch on a one-time project fee with modest ongoing hosting instead of that recurring platform subscription. You still pay normal per-sale payment processing either way.",
                },

                {
                  q: "Do you build big apps or SaaS products?",

                  a: "That is not the main focus. EuroDigital is positioned around practical websites and small-business online stores. Larger custom software is only scoped under Custom Launch when it truly fits.",
                },

                {
                  q: "Can you help with Google Business Profile and local SEO?",

                  a: "Yes — the practical kind included in launch packages: profile setup or support when it fits, Analytics, Search Console, readable service-area copy, and metadata structure search engines can parse.",
                },

                {
                  q: "What does handoff include?",

                  a: "Access you need, hosting and domain notes, email forwarding setup, analytics accounts, a short launch checklist, and a walkthrough so you can update copy or hand things to someone else without guesswork.",
                },

                {
                  q: "Where can I see more projects?",

                  a: "This page highlights local service sites, creative brands, and ecommerce — plus more live builds in the portfolio, including side projects like NoteBill.",
                },
              ]}
            />
          </div>
        </Section>

        <Section
          id="contact"
          eyebrow="Contact"
          title="Tell me about your business launch."
          subtitle="No long RFP required — a short note about your business, preferred package, and timeline is enough for a reply with next steps."
        >
          <Reveal>
            <Card className="p-8 sm:p-12">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="text-sm font-medium text-slate-600">
                    Fastest way to start
                  </div>

                  <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Share what you do, which package feels close, and your
                    timeline.
                  </div>

                  <p className="mt-3 text-slate-700">
                    Service business, creative brand, or something in between —
                    a few sentences about your customers and what “live” should
                    look like is enough to start.
                  </p>

                  <p className="mt-3 text-sm text-slate-600">
                    {CONTACT_REPLY_NOTE}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonA
                      href={`mailto:${CONTACT_EMAIL}`}
                      variant="secondary"
                      magnetic
                      analyticsLocation="contact"
                      analyticsLabel="Email contact"
                    >
                      Email {CONTACT_EMAIL}
                    </ButtonA>

                    <ButtonLink href="/projects" variant="secondary">
                      Browse portfolio
                    </ButtonLink>
                  </div>
                </div>

                <div className="grid gap-3">
                  <ContactForm email={CONTACT_EMAIL} />
                </div>
              </div>
            </Card>
          </Reveal>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
