import type { ServiceLandingContent } from "@/lib/service-landing-types";

export const smallWebsiteRepairsContent = {
  path: "/small-website-repairs",
  metaTitle: "Small website repairs from $125 CAD",
  title: "Small website repairs for existing sites",
  description:
    "EuroDigital handles narrowly scoped website repairs for Victoria and Vancouver Island businesses — copy and metadata fixes, small layout cleanup, broken links, and minor contact-flow issues — starting from $125 CAD, without turning a small problem into a rebuild.",
  eyebrow: "Existing sites",
  introNote:
    "Not every website problem needs a redesign. Small Website Repairs are for focused changes on a site you already have. If a rebuild is the honest answer, that will be said plainly and priced under the launch packages instead.",
  serviceType: "Small website repairs and cleanup",
  whoFits: [
    "Owners with a generally workable site that needs a few targeted corrections — typos, outdated service blurbs, titles, or broken links",
    "Victoria and Vancouver Island businesses that want a clear quote for a narrow fix rather than a sales push into a full rebuild",
    "People who can provide access and point to the specific pages or issues that need attention",
    "Situations where the smallest adequate solution is better than an impressive redesign proposal",
  ],
  whoDoesNotFit: [
    "Projects that need a new information architecture, new brand system, or multi-page rebuild — those belong on One-Page Launch, Business Website, redesign, or Custom Project",
    "Buyers seeking ranking guarantees or ongoing monthly retainers as the repair engagement",
    "Sites where access cannot be provided and the problem cannot be described",
    "Work that is actually ecommerce catalog build-out, payment setup, or a full migration dressed up as a “quick fix”",
  ],
  deepDive: {
    eyebrow: "Smallest adequate fix",
    title: "What counts as a small repair — and what does not.",
    subtitle:
      "The published starting price is From $125 CAD for narrowly scoped existing-site work. Platform, access, and the exact tasks change the quote. A new page or website is not priced at $125.",
    blocks: [
      {
        heading: "Typical repair work",
        body: `Small Website Repairs cover focused changes such as copy and typo corrections, page-title and metadata fixes, small content or layout corrections, broken-link and CTA cleanup, and minor contact-form or contact-flow fixes.

That list is deliberate. It matches the published offer: help when something specific is wrong, without pretending every complaint is a redesign opportunity.

Examples that often fit: an outdated phone number on three pages, a service description that no longer matches what you offer, a broken “Request a quote” link, a title tag that still names a previous business, or a spacing issue on a mobile breakpoint that makes the contact button hard to tap.`,
      },
      {
        heading: "When a repair is the wrong product",
        body: `If customers cannot tell what you do, the site looks abandoned, the CMS fights every edit, or you need several new pages with new structure, a repair quote would be dishonest. In those cases EuroDigital points to the published launch packages: One-Page Launch from $499 CAD, Business Website from $1,250 CAD, Online Store from $2,000 CAD, or Custom Project quoted.

The same honesty applies in reverse. If you inquire about a redesign and the only real issue is a handful of corrections, you should hear that a repair is enough. The principle is simple: recommend the smallest solution that adequately solves the problem.

Sites EuroDigital has built — including Maestros Services, AnglKiss Creations, and Vancouver Island Pro Roofing — are useful references for what a coherent site looks like when a rebuild is appropriate. They are not used here to invent repair metrics.`,
      },
      {
        heading: "How scoping and access work",
        body: `A repair starts with a short description of the issue, the URL, and what “done” means. You receive a written scope and price before work starts. Access to the CMS, hosting, or DNS is requested only as needed for the tasks.

Pricing is project-based, never hourly. The $125 CAD figure is a starting point for a narrow job. Several pages of rewrite, design changes across templates, plugin conflicts, or platform limitations can raise the quote — and sometimes reveal that a redesign is cheaper than fighting the current theme.

After the fix, you keep ownership. There is no requirement to buy a maintenance retainer to “keep the repair active.”`,
      },
      {
        heading: "Local owners, practical outcomes",
        body: `Vancouver Island businesses often need the site to stop embarrassing them or blocking calls — not a twelve-week discovery workshop. A corrected contact path, accurate services list, or cleaned-up metadata can be enough to make the existing site usable again while you decide whether a larger project is worth it later.

If the repair touches titles and descriptions, it can support practical search hygiene without becoming an SEO retainer. If it touches contact flows, it can support lead capture without promising inquiry volume.`,
      },
    ],
  },
  deliverables: [
    "Written repair scope listing the specific changes, assumptions, exclusions, and price",
    "The agreed corrections implemented on the existing site",
    "A short note of what changed and anything you should watch after publish",
    "Clear recommendation if the inspection shows a redesign or new site is the better path",
  ],
  exclusions: [
    "Full redesigns, new multi-page builds, or ecommerce store launches priced as repairs",
    "Ranking, traffic, or lead guarantees",
    "Unlimited revision cycles beyond the written repair scope",
    "Ongoing maintenance retainers as a requirement to complete the repair",
  ],
  dependencies: [
    "URLs and a concrete description of what is wrong and what “fixed” means",
    "CMS, hosting, or related access required to make the change",
    "Timely replies if a question blocks the repair",
    "Acceptance that platform limits may change the approach or the quote",
  ],
  localContext: [
    "Many Island service sites fail in small ways — wrong phone number, dead CTA, outdated service list — that a narrow repair can address without a rebuild",
    "Owners comparing quotes should treat $125 as a starting point for narrow work, not as the price of a new website",
    "A repair that restores a clear call path is often more valuable than another decorative homepage section",
  ],
  process: [
    {
      title: "1) Describe the issue",
      body: "You send the URL, what is broken or outdated, and any access notes. Screenshots help.",
    },
    {
      title: "2) Written repair scope",
      body: "I confirm whether it is a repair, list the tasks, and give a project price before work starts — or recommend a larger package if needed.",
    },
    {
      title: "3) Make the fix",
      body: "The agreed changes are implemented and checked on mobile and desktop where relevant.",
    },
    {
      title: "4) Confirm and close",
      body: "You review the result. Notes cover what changed. No retainer is required to finish.",
    },
  ],
  faqs: [
    {
      q: "What is the starting price?",
      a: "Small Website Repairs start from $125 CAD for narrowly scoped existing-site work. Platform, access, and the exact tasks can change the quote. A new page or website is priced under the launch packages — not at $125.",
    },
    {
      q: "Is this hourly?",
      a: "No. Pricing is project-based. You receive a written scope and price for the repair before work starts.",
    },
    {
      q: "What if you find bigger problems while repairing?",
      a: "I will say so and separate the narrow fix from any larger recommendation. You choose whether to continue with a redesign or launch package; nothing expands silently.",
    },
    {
      q: "Can you repair WordPress, Squarespace, Shopify, or custom sites?",
      a: "Often yes, depending on access and platform limits. The quote reflects what is possible on your stack. Some platforms make small changes easy; others make them expensive enough that a rebuild should be considered.",
    },
    {
      q: "Do repairs include SEO ranking work?",
      a: "Repairs can include metadata and related cleanup when scoped. They do not include ranking guarantees or ongoing SEO retainers.",
    },
  ],
  packagesMode: "repair",
  showCaseStudies: false,
  relatedLinks: [
    { href: "/website-redesign-vancouver-island", label: "Website redesign" },
    { href: "/website-design-vancouver-island", label: "Island website design" },
    { href: "/blog/website-cost-victoria-bc", label: "Website cost guide" },
    { href: "/#packages", label: "Homepage packages" },
  ],
  cta: {
    title: "Request a small repair",
    body: "Share the URL and the specific issue. I usually reply within 1–2 business days with whether it fits the repair path, a likely scope, and a written price — or an honest redirect to a larger package.",
    secondaryHref: "/?projectType=small-repair#contact",
    secondaryLabel: "Open the repair inquiry form",
  },
} as const satisfies ServiceLandingContent;
