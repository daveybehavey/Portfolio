import type { ServiceLandingContent } from "@/lib/service-landing-types";

export const webDesignParksvilleQualicumContent = {
  path: "/web-design-parksville-qualicum",
  metaTitle: "Web design Parksville and Qualicum Beach | EuroDigital",
  title: "Web design Parksville and Qualicum Beach — plan the content and the build",
  description:
    "Website design for Parksville and Qualicum Beach businesses, with published project starting prices, clear content responsibilities, and an agreed launch scope.",
  eyebrow: "Parksville · Qualicum Beach",
  introNote:
    "Web design Parksville and Qualicum Beach projects begin with the offer, the content, and the customer’s next step. EuroDigital is a one-person service-area studio based in Victoria. EuroDigital has no local client in Parksville or Qualicum Beach yet.",
  serviceType: "Website design and launch",
  areaServed: [
    { type: "City", name: "Parksville" },
    { type: "City", name: "Qualicum Beach" },
  ],
  whoFits: [
    "Owners with business information and rough notes who need those materials organized into a website.",
    "Service businesses needing room to explain services and receive inquiries.",
    "Small shops ready to supply product information for a working store.",
  ],
  whoDoesNotFit: [
    "Projects expecting full copywriting or photography to be silently included.",
    "Teams without a content decision-maker.",
    "Buyers seeking guaranteed rankings, traffic, or sales.",
  ],
  deepDive: {
    eyebrow: "Prepare the project",
    title: "Know what you are supplying and what the website includes.",
    subtitle:
      "Use the written scope to settle content, customer actions, setup work, and ownership.",
    blocks: [
      {
        heading: "Begin with the material you have",
        body: `Bring business details, services or products, the area you serve, and available logos and photos. Rough notes are fine for the first conversation. EuroDigital structures and polishes supplied material and flags where it is thin. Full copywriting and photography are separately quoted.`,
      },
      {
        heading: "Choose enough room for the offer",
        body: `A One-Page Launch provides one clear offer and a contact path. A Business Website gives services, trust material, and inquiries more room across several pages. An Online Store includes products, checkout, and payments. The scope names the size and why it fits.`,
      },
      {
        heading: "Separate supplied content from included setup",
        body: `The written scope identifies pages, customer actions, setup work, timeline, exclusions, and price. Domain and hosting connections, Analytics and Search Console, and Business Profile support follow the agreed package boundaries.`,
      },
      {
        heading: "Read starting prices as the start of a scoped quote",
        body: `Published starting prices are One-Page Launch from $499 CAD, Business Website from $1,250 CAD, and Online Store from $2,000 CAD. Small Website Repairs from $125 CAD is for narrow fixes on an existing site. Content volume, integrations, and product count can change the project quote. Written deliverables and a price come before work starts.`,
      },
      {
        heading: "Leave with access and launch notes",
        body: `Accounts remain yours. The launch handoff organizes domain, hosting, access, and notes explaining what was configured. Later small changes can be scoped as repairs; larger additions become a separate written project.`,
      },
    ],
  },
  deliverables: [
    "Written scope covering pages, customer actions, setup work, timeline, exclusions, and price.",
    "Mobile-first design and the agreed inquiry, quote-request, or purchase path.",
    "Scoped launch setup, access handoff, and launch notes.",
  ],
  exclusions: [
    "Full copywriting and photography unless separately quoted.",
    "Unlimited redesign cycles.",
    "Vague SEO retainers and promised ranking positions.",
    "Ongoing ads management, CRM administration, or hosting support unless separately agreed.",
  ],
  dependencies: [
    "Business, service or product information and the area served.",
    "Available brand material, photos, and content decisions.",
    "Required domain and hosting access.",
    "A content owner and timely review feedback.",
  ],
  localContext: [
    "This page covers website enquiries for Parksville and Qualicum Beach.",
    "EuroDigital is based in Victoria and works as a service-area business, with projects conducted by message, call, and written scope.",
    "EuroDigital has no local client in Parksville or Qualicum Beach yet.",
  ],
  process: [
    {
      title: "1) Share the starting material",
      body: "Describe the business, customers, existing setup, and goals. Bring references and identify missing content.",
    },
    {
      title: "2) Agree responsibilities and scope",
      body: "Set pages, customer actions, content ownership, setup work, timeline, exclusions, and price.",
    },
    {
      title: "3) Review the build",
      body: "Review the mobile-first website and its service, inquiry, or purchase paths before launch.",
    },
    {
      title: "4) Connect and hand over",
      body: "Complete agreed setup work and organize accounts, access, and launch notes.",
    },
  ],
  faqs: [
    {
      q: "Have you worked with a Parksville or Qualicum Beach client?",
      a: "EuroDigital has no local client in Parksville or Qualicum Beach yet.",
    },
    {
      q: "Where is EuroDigital based?",
      a: "EuroDigital is a one-person service-area business based in Victoria. There is no storefront or walk-in office; projects run by message, call, and written scope.",
    },
    {
      q: "Can we start with rough content?",
      a: "Yes. Rough notes are fine for the first conversation. You supply the business substance; EuroDigital structures and polishes it and flags gaps. Full copywriting and photography are quoted separately.",
    },
    {
      q: "What are the starting prices?",
      a: "Small Website Repairs from $125 CAD covers narrow existing-site fixes. New-site starting prices are One-Page Launch from $499 CAD, Business Website from $1,250 CAD, and Online Store from $2,000 CAD. A written project quote sets deliverables and price before work starts.",
    },
    {
      q: "What determines the launch date?",
      a: "The scope and the arrival of content, decisions, and review feedback. The written estimate includes a timeline and your dependencies.",
    },
    {
      q: "Do I keep ownership after launch?",
      a: "Yes. The accounts are yours, and the handoff organizes access and notes explaining the setup.",
    },
    {
      q: "Are rankings or sales guaranteed?",
      a: "No. The work is scoped around deliverables, with no ranking, traffic, or sales guarantee.",
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
    title: "Tell me what you have and what you need",
    body: "Share your business, services or products, existing website, and available content. Explain whether customers should inquire, request a quote, or buy.",
    secondaryHref: "/website-design-vancouver-island",
    secondaryLabel: "Explore Island website design",
  },
} as const satisfies ServiceLandingContent;
