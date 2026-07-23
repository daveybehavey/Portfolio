/** Site positioning — small-business website launches (not agency / SaaS / monthly marketing). */

export const CORE_OFFER =
  "Professional websites and working online stores for small businesses — design, Google setup, email forwarding, analytics, and handoff." as const;

/** Bundled on Starter and up — not One-Page Essentials. */
export const FULL_LAUNCH_INCLUDES = [
  "Professional, mobile-friendly website or storefront",
  "Lead sites, brand showcases, or full ecommerce (scoped to your package)",
  "Custom email forwarding",
  "Google Analytics + Search Console",
  "Google Business Profile help when it fits",
  "Basic SEO, domain & hosting setup",
  "Clear handoff — you own it",
] as const;

/** @deprecated Use FULL_LAUNCH_INCLUDES */
export const LAUNCH_INCLUDES = FULL_LAUNCH_INCLUDES;

export const PROJECT_ARCHETYPES = [
  {
    id: "service",
    title: "Local service business",
    example: "MaestrosServices",
    body: "Trades, contractors, landscapers, cleaners, repair businesses, and consultants who need to look professional, explain services, and turn visitors into calls or quote requests.",
    imageSrc: "/projects/maestrosservices.webp",
    url: "https://maestrosservices.com",
  },
  {
    id: "creative",
    title: "Creative brand or small shop",
    example: "AnglKissCreations",
    body: "Makers, artists, and handmade sellers who need a polished story, product showcase, and a simple way for people to inquire — upgrade to a full store when you are ready to sell online.",
    imageSrc: "/projects/angelkisscreations.webp",
    url: "https://angelkisscreations.com",
  },
  {
    id: "ecommerce",
    title: "Online store (ecommerce)",
    example: "StarMapCo",
    body: "Small shops that need a real storefront — product pages, cart, checkout, and payments — without a Shopify-style monthly platform bill when a simpler stack fits (e.g. WooCommerce, Square, Stripe checkout), plus launch support and handoff.",
    imageSrc: "/projects/starmapco.webp",
    url: "https://starmapco.com",
  },
] as const;

export const PACKAGES = [
  {
    name: "One-Page Essentials",
    price: "From $299 CAD",
    badge: "Bare minimum",
    essentialsOnly: true,
    bestFor:
      "You only need to exist online — what you do, how to reach you — with no extras.",
    includes: [
      "Single-page site (HTML, CSS, and JavaScript — lightweight and fast)",
      "Domain + hosting connection (e.g. Cloudflare Pages)",
      "Mobile-friendly layout",
      "Phone, email, or social links on the page (no contact form)",
      "You own the files — simple handoff",
    ],
    excludesNote:
      "Does not include Google Analytics, Search Console, Business Profile, custom email forwarding, contact forms, or multi-page builds.",
  },
  {
    name: "Starter Website",
    price: "Private quote · typically $399–$699 CAD",
    bestFor:
      "A small brochure site (not a bare landing page) with contact form, basic SEO, and email forwarding.",
    includes: [
      "1–3 page website",
      "Mobile-friendly design",
      "Contact form",
      "Basic SEO",
      "Domain & hosting connection",
      "Custom email forwarding",
      "Basic handoff",
    ],
  },
  {
    name: "Business Launch",
    price: "From $849 CAD",
    bestFor: "Service businesses that need a proper online presence.",
    highlight: true,
    badge: "Most popular",
    includes: [
      "3–6 page professional website",
      "Services overview + contact form",
      "Google Business Profile setup/support",
      "Custom email forwarding",
      "Google Analytics + Search Console",
      "Basic SEO",
      "Domain & hosting setup",
      "Launch checklist + handoff docs",
    ],
  },
  {
    name: "Creative / Brand Launch",
    price: "From $849 CAD",
    bestFor: "Creators and brands that need showcase pages and inquiries (catalog-style, not full cart/checkout).",
    includes: [
      "Brand-focused website",
      "About + product/service showcase",
      "Contact or inquiry form",
      "Social links",
      "Basic SEO",
      "Custom email forwarding",
      "Domain, hosting, analytics & Search Console",
      "Handoff documentation",
    ],
  },
  {
    name: "Ecommerce Store Launch",
    price: "From $999 CAD",
    bestFor: "Small shops ready to sell online with a working store — not just product photos on a brochure site.",
    includes: [
      "Full storefront setup (platform chosen to fit your needs)",
      "Product catalog, collections, and key store pages",
      "Cart, checkout, and payment processing connection",
      "Shipping, tax, and email notifications configured (as needed)",
      "Mobile-friendly design + basic SEO",
      "Domain, hosting, Analytics & Search Console",
      "Walkthrough: add products, fulfill orders, day-to-day basics",
    ],
  },
  {
    name: "Custom Launch",
    price: "Quoted per project",
    bestFor: "When you need a mix of features — extra pages, booking, subscriptions, migrations, or integrations beyond a standard package.",
    span: "full" as const,
    includes: [
      "Scoped after a short discovery call",
      "Examples: multi-location sites, complex forms, CRM hooks, automations, payment links, headless setups",
      "Can combine brochure pages + store features when it makes sense",
    ],
  },
] as const;
