import Image from "next/image";
import Link from "next/link";
import { Accordion } from "@/components/Accordion";
import { BrandLogo } from "@/components/BrandLogo";
import { ButtonA, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";
import { HeroCollage } from "@/components/HeroCollage";
import { HeroIntro } from "@/components/HeroIntro";
import { HeroSection } from "@/components/HeroSection";
import { MobileNav } from "@/components/MobileNav";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/site";
import { projects } from "@/lib/projects";

const [featuredProject, ...otherProjects] = projects;
const homepageProjects = otherProjects.slice(0, 2);

export default function Home() {
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
            <nav className="hidden items-center gap-0.5 text-sm sm:flex" aria-label="Primary">
              <a href="#featured" className="nav-link">
                NoteBill
              </a>
              <a href="#work" className="nav-link">
                Work
              </a>
              <a href="#services" className="nav-link">
                Services
              </a>
              <a href="#process" className="nav-link">
                Process
              </a>
              <Link href="/projects" className="nav-link">
                Portfolio
              </Link>
              <a href="#contact" className="nav-link">
                Contact
              </a>
            </nav>
            <MobileNav />
          </div>
        </Container>
      </header>

      <main id="main-content" tabIndex={-1} className="outline-none pb-24 sm:pb-0">
        <HeroSection>
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <HeroIntro />

              <div className="lg:col-span-5">
                <Reveal delay={0.08}>
                  <HeroCollage
                    items={[
                      {
                        src: featuredProject.imageSrc,
                        alt: "NoteBill app",
                        className: "col-span-7 aspect-[16/10]",
                        speed: 1
                      },
                      {
                        src: "/projects/starmapco.webp",
                        alt: "StarMapCo website",
                        className: "col-span-5 aspect-[16/10]",
                        speed: 0.85
                      },
                      {
                        src: "/projects/maestrosservices.webp",
                        alt: "MaestrosServices website",
                        className: "col-span-5 aspect-[16/10]",
                        speed: 0.7
                      },
                      {
                        src: "/projects/angelkisscreations.webp",
                        alt: "AnglKissCreations website",
                        className: "col-span-7 aspect-[16/10]",
                        speed: 0.95
                      }
                    ]}
                  />

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { k: "Focus", v: "Fixed-scope builds" },
                      { k: "Style", v: "Calm, modern UI" },
                      { k: "Discover", v: "Local-ready SEO" },
                      { k: "Wrap-up", v: "You own the keys" }
                    ].map((item) => (
                      <Card
                        key={item.k}
                        className="p-4 transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                      >
                        <div className="text-xs font-medium text-slate-600">{item.k}</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{item.v}</div>
                      </Card>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </Container>
        </HeroSection>

        <Section
          id="featured"
          eyebrow="Live on Google Play"
          title="Meet NoteBill — invoicing built for solo operators."
          subtitle="A real product in the store beats mockups every time. NoteBill is the fastest way to see how I think about UX, AI-assisted flows, and shipping something people actually open every week."
        >
          <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
            <Reveal className="lg:col-span-7">
              <Card className="overflow-hidden rounded-3xl transition-shadow duration-500 ease-out hover:shadow-xl hover:shadow-indigo-950/[0.08] motion-reduce:hover:shadow-md">
                <div className="grid h-full gap-0 lg:grid-cols-2">
                  <div className="relative min-h-[260px] lg:min-h-full">
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
                    <div className="text-sm font-medium uppercase tracking-wider text-slate-500">NoteBill</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      AI-assisted invoicing for people who wear every hat.
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-slate-700">
                      NoteBill drafts and organizes invoices so you spend less time wording line items and more time
                      getting paid. It is live on Google Play, tuned for contractors and solo operators, and evolving
                      with real feedback.
                    </p>
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
                        <ButtonA href={featuredProject.playStoreUrl} target="_blank" rel="noopener noreferrer" magnetic>
                          Get on Google Play
                        </ButtonA>
                      ) : null}
                      <ButtonA
                        href={featuredProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="secondary"
                        magnetic={!featuredProject.playStoreUrl}
                      >
                        notebill.app
                      </ButtonA>
                      <ButtonLink href="/projects" variant="secondary">
                        View all projects
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>

            <Reveal delay={0.05} className="lg:col-span-5">
              <Card className="p-7 sm:p-8">
                <div className="text-sm font-medium text-slate-600">Why it leads the page</div>
                <div className="mt-3 grid gap-3">
                  {[
                    "It is shipped software — not a concept deck.",
                    "It shows how I design for busy owners who need invoices off their plate.",
                    "It covers app craft, AI-assisted UX, and what launch support looks like.",
                    "It gives you a product story, not just a carousel of static shots."
                  ].map((item, idx) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/5"
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
                <div className="mt-6 rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/80 via-white/70 to-teal-50/40 p-4 text-sm leading-relaxed text-slate-700">
                  Early days call for honest numbers — I will surface traction here as it grows instead of padding the
                  story.
                </div>
              </Card>
            </Reveal>
          </div>
        </Section>

        <Section
          id="work"
          eyebrow="Selected work"
          title="A tight snapshot next to NoteBill."
          subtitle="Homepage visitors see range and craft fast; the portfolio page holds the full set when you want to browse every build."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              I keep the fold intentional — depth lives one click away.
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
          id="services"
          eyebrow="Services"
          title="What I build — and how we wrap."
          subtitle="I shine on scoped builds: ship something solid, show you how to run it, then step back. Ongoing retainers only happen when we both want that arrangement."
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <Card className="p-7 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0">
                <div className="text-sm font-medium text-slate-600">Best fit</div>
                <div className="mt-3 text-3xl font-semibold text-slate-900">Build, launch, hand off.</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-700">
                  You get a written scope, predictable milestones, and a finished thing you can operate — no mystery
                  invoices or endless “just one more tweak” cycles unless we plan for them up front.
                </div>
                <div className="mt-6 grid gap-2 text-sm text-slate-800">
                  {["Custom websites", "Mobile app builds", "Launch-ready SEO basics", "Project handoff + credentials"].map(
                    (item) => (
                      <div key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        <span>{item}</span>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-7">
                  <ButtonLink href="#contact" className="w-full" magnetic>
                    Start a project
                  </ButtonLink>
                </div>
              </Card>
            </Reveal>

            <div className="grid gap-4 lg:col-span-7 sm:grid-cols-2">
              {[
                {
                  title: "Websites",
                  body: "Lead-ready sites for trades, shops, and makers who need to look legit the second someone lands on mobile.",
                  list: ["Service storytelling", "CTAs that match how you sell", "Layouts that stay fast"]
                },
                {
                  title: "Apps",
                  body: "Focused mobile work — MVPs and v1s where the interface and launch checklist both have to be real.",
                  list: ["Product UI", "Sensible feature cuts", "Store-ready polish"]
                },
                {
                  title: "SEO basics",
                  body: "Foundational structure so Google (and humans) understand who you help and where you show up.",
                  list: ["Metadata + schema basics", "Clean heading flow", "Neighborhood-aware copy"]
                },
                {
                  title: "Handoff",
                  body: "Access, repos, and a walkthrough so you are never guessing what shipped or how to keep it alive.",
                  list: ["Credential pass", "Repo or export", "What to do next"]
                }
              ].map((service, idx) => (
                <Reveal key={service.title} delay={0.03 * idx}>
                  <Card className="p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0">
                    <div className="text-base font-semibold text-slate-900">{service.title}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-700">{service.body}</div>
                    <ul className="mt-4 grid gap-2 text-sm text-slate-800">
                      {service.list.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Section
          id="process"
          eyebrow="Process"
          title="From first message to launch without the fog."
          subtitle="Every step has a visible outcome — you always know what is happening now and what “done” includes."
        >
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              {
                t: "1) Discovery",
                d: "You share goals, audience, and a few references. I confirm fit, risks, and what a realistic v1 covers."
              },
              {
                t: "2) Plan",
                d: "We lock pages or features, success metrics, and a timeline so the build does not sprawl mid-flight."
              },
              {
                t: "3) Build",
                d: "Design and implementation stay mobile-first, performance-conscious, and aligned to the plan we wrote down."
              },
              {
                t: "4) Handoff",
                d: "Access, repos, hosting notes, and a concise walkthrough — you can keep shipping without waiting on me."
              }
            ].map((step, idx) => (
              <Reveal key={step.t} delay={0.03 * idx}>
                <Card className="p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0">
                  <div className="text-base font-semibold text-slate-900">{step.t}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-700">{step.d}</div>
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
                  q: "Do you stay on for monthly product management?",
                  a: "Rarely by default. I am happiest delivering a scoped build plus launch support. If you want a longer rhythm afterward, we will spell out what that means so expectations stay clean."
                },
                {
                  q: "Can you help with local SEO?",
                  a: "Yes — the practical kind. Clear service areas, human-readable headings, metadata that matches how you actually talk to customers, and structure search engines can parse without gimmicks."
                },
                {
                  q: "What does handoff include?",
                  a: "The accesses you need, repos or exports, hosting notes, and a focused walkthrough so you can update copy, post blogs, or hand things to another dev without guesswork."
                },
                {
                  q: "Where can I see everything you have shipped?",
                  a: "The homepage highlights the strongest proof — especially NoteBill — and the portfolio page collects the rest for a fuller picture."
                }
              ]}
            />
          </div>
        </Section>

        <Section id="contact" eyebrow="Contact" title="Tell me what you are shipping next.">
          <Reveal>
            <Card className="p-8 sm:p-12">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="text-sm font-medium text-slate-600">Fastest way to start</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    A tight note beats a vague brief — I will answer with next steps.
                  </div>
                  <div className="mt-3 text-slate-700">
                    Share what you sell, what success looks like, any deadlines, and whether you want launch-only help
                    or a longer rhythm after go-live.
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonA href={`mailto:${CONTACT_EMAIL}`} variant="secondary" magnetic>
                      Email hello@eurodigital.ca
                    </ButtonA>
                    <ButtonLink href="/projects" variant="secondary">
                      Browse projects
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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/92 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_-16px_rgba(15,23,42,0.1)] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4">
          <div className="text-xs font-medium text-slate-700">Planning a site or app?</div>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition duration-200 ease-out hover:bg-blue-500 active:scale-[0.96] touch-manipulation motion-reduce:active:scale-100"
          >
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}

