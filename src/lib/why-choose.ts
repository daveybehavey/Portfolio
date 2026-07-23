/** Comparison copy — verify Shopify plans periodically (shopify.com/ca/pricing). */

export const SHOPIFY_BASIC_CAD = {
  monthly: 49,
  yearlyPerMonth: 37,
  sourceLabel: "Shopify Canada pricing",
  sourceUrl: "https://www.shopify.com/ca/pricing",
} as const;

export const WHY_CHOOSE_INTRO =
  "Platforms like Shopify are great at scale — but many Island shops only need a straightforward store without a growing monthly platform bill." as const;

export const WHY_CHOOSE_POINTS = [
  {
    title: "Skip the monthly platform fee",
    body: `Shopify’s Basic plan is about $${SHOPIFY_BASIC_CAD.monthly} CAD/month (or ~$${SHOPIFY_BASIC_CAD.yearlyPerMonth}/mo on annual billing) before paid apps, themes, or add-ons — per ${SHOPIFY_BASIC_CAD.sourceLabel}. EuroDigital can launch a working online store without that recurring Shopify subscription.`,
  },
  {
    title: "One-time launch, not rent forever",
    body: "You pay for a scoped build and handoff — your site, your accounts, your products. No feeling stuck on a template you do not control because the monthly bill keeps auto-charging.",
  },
  {
    title: "Still sells like a real store",
    body: "Product pages, cart, checkout, and payments — set up on a stack that fits your size (for example WooCommerce, Square, Stripe, or similar). You get commerce without paying for enterprise features you will never touch.",
  },
  {
    title: "Honest ongoing costs",
    body: "You will still have normal business expenses: domain, hosting (often modest), and payment processing per sale (similar percentages to Shopify Payments). The difference is avoiding a large fixed platform fee every month for a small catalog.",
  },
  {
    title: "Google & email included in the launch",
    body: "Analytics, Search Console, Business Profile help when it fits, custom email forwarding, and basic SEO — bundled into the launch, not sold as separate monthly marketing retainers.",
  },
  {
    title: "Local, direct, and plain-language",
    body: "One person who builds and explains the setup — not a ticket queue, app maze, or agency handoff chain. Good fit when you want it working and want to know how to run it.",
  },
] as const;

/** Illustrative 3-year comparison — not a guarantee of every stack’s hosting bill. */
export const COST_SNAPSHOT = {
  headline: "Rough picture over three years (platform fees only)",
  shopifyNote: `Shopify Basic ≈ $${SHOPIFY_BASIC_CAD.monthly}/mo × 36 months → about $${SHOPIFY_BASIC_CAD.monthly * 36} CAD in subscription fees alone (before apps or themes).`,
  eurodigitalNote:
    "EuroDigital Ecommerce Store Launch is a one-time project fee (from $999) plus typical hosting/domain costs — often far less per month than a Shopify plan for a small shop.",
  disclaimer:
    "Illustration only. Your stack, traffic, and payment volume change the real numbers. Payment processing fees apply on any platform.",
} as const;
