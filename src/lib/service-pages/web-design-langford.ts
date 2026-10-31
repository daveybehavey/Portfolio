import type { ServiceLandingContent } from "@/lib/service-landing-types";

export const webDesignLangfordContent = {
  path: "/web-design-langford",
  metaTitle: "Web design Langford — small-business websites | EuroDigital",
  title: "Web design Langford — choose a website that fits the work",
  description:
    "Web design for Langford businesses: choose a one-page launch, business website, or online store, with published starting prices and a written project scope.",
  eyebrow: "Langford · Colwood · Sooke",
  introNote:
    "Web design Langford projects start with what your business needs customers to understand and do. EuroDigital is a one-person service-area studio based in Victoria. EuroDigital has no local client in Langford yet.",
  serviceType: "Website design and launch",
  areaServed: [
    { type: "City", name: "Langford" },
    { type: "City", name: "Colwood" },
    { type: "City", name: "Sooke" },
  ],
  whoFits: [
    "Service businesses that need clear service explanations and a contact or quote-request path.",
    "Owners choosing between one useful page and a website with room for several services.",
    "Small shops that need products, checkout, and payments.",
    "Owners ready to supply business information and make content decisions.",
  ],
  whoDoesNotFit: [
    "Buyers seeking guaranteed rankings, traffic, or sales.",
    "Teams expecting an ongoing marketing or SEO retainer as the default.",
    "Projects without a content owner or agreed exclusions.",
  ],
  deepDive: {
    eyebrow: "Choose the scope",
    title: "Start with the customer action, then choose the website.",
    subtitle:
      "Decide what needs explaining, how customers should respond, and who supplies the material.",
    blocks: [
      {
        heading: "One page, a business website, or a store",
        body: `A One-Page Launch suits a small business that needs one clear offer and a contact path. A Business Website provides room for services, trust material, and quote requests across several pages. An Online Store adds a storefront with products, checkout, and payments. The written scope explains the size being recommended.`,
      },
      {
        heading: "Make the inquiry path part of the scope",
        body: `Decide whether the visitor should call, send an inquiry, request a quote, or buy. The page structure and calls to action are built around that decision. Contact and quote-request paths belong in the plan from the start.`,
      },
      {
        heading: "Separate repairs from a new website",
        body: `Small Website Repairs from $125 CAD covers narrow fixes on an existing site. For a new build, published starting prices are One-Page Launch from $499 CAD, Business Website from $1,250 CAD, and Online Store from $2,000 CAD. Pricing is project-based. Content volume, integrations, and product count can change the quote; written deliverables and a price come before work starts.`,
      },
      {
        heading: "Agree who supplies the content",
        body: `You supply business details, services or products, the area you serve, and available logos and photos. Rough notes are enough for a first conversation. EuroDigital builds the structure and design around that material and flags gaps. Full copywriting and photography are separately quoted.`,
      },
      {
        heading: "Plan the handoff before launch",
        body: `The scope identifies domain and hosting connections, access, and launch notes. Analytics and Search Console are included when in scope; Business Profile support is included when it fits. Accounts remain yours. Larger additions after launch become their own written project.`,
      },
    ],
  },
  deliverables: [
    "Written pages, customer actions, setup work, timeline, exclusions, and price.",
    "Mobile-first website design and a contact, quote-request, or purchase path matched to the package.",
    "Agreed launch setup, launch notes, and ownership handoff.",
  ],
  exclusions: [
    "Ranking promises and vague SEO retainers.",
    "Unlimited redesign cycles outside the written scope.",
    "Copywriting or photography unless separately quoted.",
    "Ongoing ads management, CRM administration, or hosting support unless separately agreed.",
  ],
  dependencies: [
    "Business details, services or products, service area, and required pages.",
    "Available logo, photos, content decisions, and a person responsible for review.",
    "Domain and hosting access when connections are included.",
    "Timely feedback.",
  ],
  localContext: [
    "This page covers website enquiries for Langford, Colwood, and Sooke.",
    "EuroDigital works from Victoria as a service-area business. Projects run by message, call, and written scope.",
    "EuroDigital has no local client in Langford yet.",
  ],
  process: [
    {
      title: "1) Fit and discovery",
      body: "Share the business, customers, existing setup, goals, and references. I confirm fit and identify missing information.",
    },
    {
      title: "2) Written scope",
      body: "Agree pages, customer actions, content responsibilities, setup work, timeline, exclusions, and price.",
    },
    {
      title: "3) Build and review",
      body: "Review the mobile-first design, service explanations, and calls to action before launch.",
    },
    {
      title: "4) Launch and handoff",
      body: "Organize domain, hosting, access, and launch notes. Any Analytics, Search Console, or Business Profile work follows the agreed scope.",
    },
  ],
  faqs: [
    {
      q: "Have you worked with a Langford client?",
      a: "EuroDigital has no local client in Langford yet.",
    },
    {
      q: "Do you have a Langford office?",
      a: "EuroDigital is a service-area business based in Victoria, with no storefront or walk-in office. Projects run by message, call, and written scope.",
    },
    {
      q: "How much does a website cost?",
      a: "Published starting prices are Small Website Repairs from $125 CAD for narrow existing-site fixes, One-Page Launch from $499 CAD, Business Website from $1,250 CAD, and Online Store from $2,000 CAD. Projects are priced by scope. You receive written deliverables and a price before work starts.",
    },
    {
      q: "What do I need to supply?",
      a: "Business details, services or products, service area, and available content and photos. Rough notes are fine initially. Full copywriting and photography are quoted separately.",
    },
    {
      q: "When can the website launch?",
      a: "Timing depends on scope, content, and decisions. The written estimate includes a timeline and the information or access needed from you.",
    },
    {
      q: "Who owns the accounts after launch?",
      a: "The accounts are yours. The handoff organizes access and notes so you understand what was configured.",
    },
    {
      q: "Can you guarantee rankings or sales?",
      a: "No. The engagement is for scoped deliverables, with no ranking, traffic, or sales guarantee.",
    },
  ],
  packagesMode: "city",
  showCaseStudies: false,
  relatedLinks: [
    { href: "/website-design-vancouver-island", label: "Island website design hub" },
    {
      href: "/google-business-profile-setup-victoria",
      label: "Google Business Profile setup in Victoria",
    },
    { href: "/blog/website-cost-victoria-bc", label: "Website costs: Victoria guide" },
  ],
  cta: {
    title: "Tell me what your Langford website needs to do",
    body: "Share what the business does, who it serves, and whether customers should call, request a quote, or buy. Include the pages and content you already have.",
    secondaryHref: "/blog/website-cost-victoria-bc",
    secondaryLabel: "Read the Victoria website-cost guide",
  },
} as const satisfies ServiceLandingContent;
