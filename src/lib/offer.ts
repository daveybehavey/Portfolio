/** Site positioning — focused small-business website launches, not broad agency retainers. */

export const CORE_OFFER =
  "Professional websites that help Vancouver Island businesses earn trust, calls, quote requests, and online sales — with clear scope, practical setup, and a handoff you own." as const;

/** Bundled on Business Website and Online Store projects. */
export const FULL_LAUNCH_INCLUDES = [
  "Professional, mobile-first design",
  "Clear pages and calls to action for your customers",
  "Contact or inquiry flow suited to the project",
  "Google Analytics + Search Console",
  "Basic SEO, domain, and hosting setup",
  "Clear handoff — your accounts and files",
] as const;

/** @deprecated Use FULL_LAUNCH_INCLUDES */
export const LAUNCH_INCLUDES = FULL_LAUNCH_INCLUDES;

export const PROJECT_ARCHETYPES = [
  {
    id: "service",
    title: "Local service business",
    example: "MaestrosServices",
    body: "For trades, contractors, landscapers, cleaners, repair businesses, and consultants that need to look credible, explain services clearly, and make calls or quote requests easy.",
    imageSrc: "/projects/maestrosservices.webp",
    url: "https://maestrosservices.com",
  },
  {
    id: "creative",
    title: "Creative brand or maker",
    example: "AnglKissCreations",
    body: "For makers, artists, and small brands that need a polished story, a strong product or service showcase, and a simple inquiry path without pretending they need a large agency build.",
    imageSrc: "/projects/angelkisscreations.webp",
    url: "https://angelkisscreations.com",
  },
  {
    id: "ecommerce",
    title: "Working online store",
    example: "StarMapCo",
    body: "For small shops ready for a real storefront with product pages, cart, checkout, payments, and a practical operating handoff — not just a gallery of products.",
    imageSrc: "/projects/starmapco.webp",
    url: "https://starmapco.com",
  },
] as const;

export const PACKAGES = [
  {
    name: "One-Page Launch",
    price: "From $499 CAD",
    badge: "Lean starting point",
    essentialsOnly: true,
    bestFor:
      "A new or very small business that needs one credible page with a clear offer and contact path.",
    includes: [
      "One focused, mobile-friendly page",
      "Services or offer summary",
      "Phone, email, or social contact links",
      "Domain + hosting connection",
      "Basic metadata and search-friendly structure",
      "Simple ownership handoff",
    ],
    excludesNote:
      "Best for a narrow scope. Multi-page content, analytics, Business Profile work, advanced forms, and integrations belong in a larger package.",
  },
  {
    name: "Business Website",
    price: "From $1,250 CAD",
    bestFor:
      "Local service businesses, professionals, and growing brands that need a complete website built to earn trust and inquiries.",
    highlight: true,
    badge: "Recommended",
    includes: [
      "3–6 page professional website",
      "Home, services, trust, and contact structure",
      "Contact or quote-request flow",
      "Google Business Profile support when it fits",
      "Analytics + Search Console",
      "Basic local SEO structure",
      "Domain, hosting, and email-forwarding setup",
      "Launch checklist + handoff documentation",
    ],
  },
  {
    name: "Online Store",
    price: "From $2,000 CAD",
    bestFor:
      "Small shops ready to sell through a working storefront with products, checkout, payments, and day-to-day handoff.",
    includes: [
      "Storefront and key commerce pages",
      "Product catalog and collections",
      "Cart, checkout, and payment connection",
      "Shipping, tax, and notification basics as scoped",
      "Mobile-first design + basic SEO",
      "Analytics, domain, and hosting setup",
      "Walkthrough for products, orders, and fulfillment",
    ],
  },
  {
    name: "Custom Project",
    price: "Quoted per project",
    bestFor:
      "Booking, subscriptions, migrations, multi-location content, integrations, or a mix that does not fit a standard launch.",
    span: "full" as const,
    includes: [
      "Scoped after a short discovery conversation",
      "Written deliverables, assumptions, and exclusions",
      "Examples: booking, advanced forms, CRM hooks, automations, migrations, or mixed brochure/store work",
      "Milestones and acceptance checks matched to the project",
    ],
  },
] as const;