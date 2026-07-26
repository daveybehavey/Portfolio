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
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { WhyChooseSection } from "@/components/WhyChooseSection";
import { FULL_LAUNCH_INCLUDES, PACKAGES, PROJECT_ARCHETYPES } from "@/lib/offer";
import { projects } from "@/lib/projects";
import { CONTACT_EMAIL, CONTACT_REPLY_NOTE } from "@/lib/site";

const homepageProjects = projects.filter(
  (project) => project.name === "MaestrosServices" || project.name === "StarMapCo",
);

const heroFacts = [
  { key: "Built for", value: "Local businesses" },
  { key: "Scope", value: "Clear project" },
  { key: "Setup", value: "Google + domain" },
  { key: "Handoff", value: "You own it" },
] as const;

const processSteps = [
  {
    title: "1) Fit and discovery",
    body: "You share the business, customers, current setup, goals, and a few references. I confirm whether the project fits and what information is still missing.",
  },
  {
    title: "2) Written scope",
    body: "We lock the pages, customer actions, content responsibilities, setup work, timeline, exclusions, and price before the build expands.",
  },
  {
    title: "3) Build and review",
    body: "The site is designed mobile-first around credibility, services or products, clear calls to action, and a practical search-friendly structure.",
  },
  {
    title: "4) Launch and handoff",
    body: "Domain, hosting, analytics, Search Console, account access, launch notes, and a walkthrough are organized so you understand what you own.",
  },
] as const;

const faqItems = [
  {
    q: "Are these prices fixed?",
    a: "They are starting points for a defined scope. One-Page Launch starts at $499 CAD, Business Website starts at $1,250 CAD, and Online Store starts at $2,000 CAD. Content volume, integrations, product count, migrations, and unusual requirements can change the quote. You receive written deliverables and a price before work starts.",
  },
  {
    q: "What is included in the One-Page Launch?",
    a: "One focused, mobile-friendly page with your offer, services or key information, contact links, basic metadata, and domain/hosting connection. It is intentionally lean. Multi-page content, advanced forms, analytics, Business Profile work, and integrations belong in a larger launch.",
  },
  {
    q: "Who is the Business Website for?",
    a: "It is the core offer for trades, local service businesses, professionals, and growing brands that need several pages, stronger trust content, a proper inquiry path, practical Google setup, and a documented handoff.",
  },
  {
    q: "Is this a monthly marketing or IT retainer?",
    a: "No. The standard offer is a one-time scoped website launch. Ongoing updates, maintenance, content, or marketing can be quoted separately when they are genuinely useful, but they are not required to keep the project relationship alive.",
  },
  {
    q: "How long does a website take?",
    a: "Timing depends on scope and how quickly content and decisions arrive. A small one-page project can move quickly; a multi-page business site or store takes longer because content, review, products, payments, and launch setup require more coordination. The written estimate includes a realistic timeline and client dependencies.",
  },
  {
    q: "Can you build a working online store?",
    a: "Yes. Online Store projects can include products, collections, cart, checkout, payments, shipping and tax basics, notifications, analytics, and a walkthrough for day-to-day operations. The stack is chosen to fit the business rather than forcing every shop into the same platform.",
  },
  {
    q: "Can you help with Google Business Profile and local SEO?",
    a: "Yes, within a practical launch scope: Business Profile support when appropriate, Analytics, Search Console, readable service-area content, technical metadata, and a site structure search engines can understand. EuroDigital does not promise rankings or sell vague SEO guarantees.",
  },
  {
    q: "What does handoff include?",
    a: "The relevant account access, domain and hosting notes, analytics setup, launch checklist, files or repository access, and a walkthrough appropriate to the project. The goal is to leave ownership understandable rather than keeping essential access hidden.",
  },
] as const;

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <PageBackground />
      <SkipLink />
      <SiteHeader />

      <main id="main-content" tabIndex={-1} className="relative z-10 outline-none">
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
                    {heroFacts.map((item) => (
                      <Card
                        key={item.key}
                        className="p-4 transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                      >
                        <div className="text-xs font-medium text-slate-600">{item.key}</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {item.value}
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
          eyebrow="Live examples"
          title="Three practical ways EuroDigital can help you launch."
          subtitle="Local service businesses are the core focus, with polished brand sites and working ecommerce available when those are the right fit. Every example below is live and inspectable."
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
                      Open live site
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
          eyebrow="Launch offers"
          title="Four clear ways to get your business online."
          subtitle="These are starting points for a defined scope, not teaser prices. Business Website is the recommended path for most established local businesses that need a credible site and a proper inquiry flow."
        >
          <div className="grid gap-4">
            <Reveal>
              <Card className="p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0 sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-600">
                      Business Website and Online Store launches include
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      One-Page Launch is deliberately lean. Larger launches include the full
                      planning, setup, measurement, and handoff layer.
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
                    href="#contact"
                    className="w-full shrink-0 lg:w-auto"
                    magnetic
                    analyticsLocation="packages"
                    analyticsLabel="Request a project estimate"
                  >
                    Request a project estimate
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
                    <div className="text-base font-semibold text-slate-900">{pkg.name}</div>
                    <div className="mt-1 text-sm font-medium text-indigo-700">{pkg.price}</div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{pkg.bestFor}</p>
                    {"excludesNote" in pkg && pkg.excludesNote ? (
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        {pkg.excludesNote}
                      </p>
                    ) : null}
                    <ul className="mt-4 grid flex-1 gap-2 text-sm text-slate-800">
                      {pkg.includes.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <ButtonLink
                        href="#contact"
                        variant={"highlight" in pkg && pkg.highlight ? "primary" : "secondary"}
                        className="w-full text-sm"
                        magnetic={"highlight" in pkg && !!pkg.highlight}
                        analyticsLocation="packages"
                        analyticsLabel={`Request estimate — ${pkg.name}`}
                      >
                        Request an estimate
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
          eyebrow="Selected proof"
          title="Live projects you can inspect — without invented results."
          subtitle="The work below demonstrates service-business lead structure and a complete ecommerce purchase flow. Claims stay limited to what the live projects and repository can support."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              More client work and side projects are available in the full portfolio.
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
          subtitle="Fixed scope, visible milestones, honest dependencies, and a handoff you can actually use."
        >
          <div className="grid gap-4 lg:grid-cols-4">
            {processSteps.map((step, idx) => (
              <Reveal key={step.title} delay={0.03 * idx}>
                <Card className="p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0">
                  <div className="text-base font-semibold text-slate-900">{step.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-700">
                    {step.body}
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section id="faq" eyebrow="FAQ" title="Straight answers before you inquire">
          <div className="max-w-3xl">
            <Accordion items={faqItems} />
          </div>
        </Section>

        <Section
          id="contact"
          eyebrow="Project estimate"
          title="Tell me what your business needs to launch."
          subtitle="A short note about your business, customers, current website, preferred package, and timing is enough to start. You will receive a fit response and the next information needed for a written estimate."
        >
          <Reveal>
            <Card className="p-8 sm:p-12">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="text-sm font-medium text-slate-600">
                    Useful details to include
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    What you do, who you serve, and what the website needs to help them do.
                  </div>
                  <p className="mt-3 text-slate-700">
                    Mention the current site or domain, likely pages, important features, target
                    timing, and whether content or branding already exists. Rough notes are fine.
                  </p>
                  <p className="mt-3 text-sm text-slate-600">{CONTACT_REPLY_NOTE}</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    The current form prepares an email in your device&apos;s email app. A reliable
                    server-side form is planned separately so its email and anti-spam requirements
                    can be configured and reviewed properly.
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