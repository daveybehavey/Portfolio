export type BlogPost = {
  slug: string;
  path: `/blog/${string}`;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  eyebrow: string;
  /** Full post body as ordered sections for the article template. */
  sections: readonly {
    heading?: string;
    paragraphs: readonly string[];
    list?: readonly string[];
  }[];
  relatedLinks: readonly { href: string; label: string }[];
};

export const blogPosts: readonly BlogPost[] = [
  {
    slug: "website-cost-victoria-bc",
    path: "/blog/website-cost-victoria-bc",
    title: "What a website costs in Victoria, BC (published EuroDigital packages)",
    description:
      "A clear look at EuroDigital’s published project-based website prices for Victoria and Vancouver Island — Small Website Repairs, One-Page Launch, Business Website, Online Store, and Custom Project — without hourly billing myths.",
    publishedAt: "2026-10-15",
    eyebrow: "Pricing",
    sections: [
      {
        paragraphs: [
          "If you run a small business in Victoria or elsewhere on Vancouver Island, website pricing can feel intentionally foggy. Some quotes are hourly with no ceiling. Others hide the real number behind “it depends” until you have already spent three discovery calls.",
          "EuroDigital publishes starting prices for defined scopes. This post explains what those packages are for, what usually changes a quote, and how to choose without inventing industry averages or competitor price surveys. The only numbers here are the ones already published on eurodigital.ca.",
        ],
      },
      {
        heading: "Project-based pricing — not hourly",
        paragraphs: [
          "EuroDigital prices work as a project with written deliverables, not as an open hourly meter. You receive a scope and a price before build work expands. That keeps both sides honest: the studio cannot quietly expand the invoice, and you cannot quietly expand the wish list without revisiting the scope.",
          "Content volume, integrations, product count, migrations, and unusual requirements can change the quote. Starting prices are starting points — not coupons that stretch forever.",
        ],
      },
      {
        heading: "Published packages and starting prices",
        paragraphs: [
          "These are the current published offers:",
        ],
        list: [
          "Small Website Repairs — from $125 CAD — narrowly scoped fixes on a site you already have (copy, metadata, small layout or link cleanup, minor contact-flow issues). A new page or website is not priced at $125.",
          "One-Page Launch — from $499 CAD — one credible page with offer, contact path, basic metadata, and domain/hosting connection. Intentionally lean.",
          "Business Website — from $1,250 CAD — the core multi-page offer for local service businesses and growing brands: trust, services, inquiry path, practical Google setup when it fits, and handoff.",
          "Online Store — from $2,000 CAD — storefront, catalog, cart, checkout, payments, and a walkthrough for day-to-day operations.",
          "Custom Project — quoted per project — booking, subscriptions, migrations, multi-location content, integrations, or mixes that do not fit a standard launch.",
        ],
      },
      {
        heading: "How to choose without overbuying",
        paragraphs: [
          "Start with the job the website must do. If customers only need to understand the offer and call or email, a One-Page Launch or Business Website is usually enough. If they need to buy online with cart and checkout, budget for Online Store. If three broken links are the whole problem, ask for Small Website Repairs.",
          "Victoria-area trades and local services often land on Business Website because they need several clear pages and a quote path. Makers sometimes start leaner and add commerce later. Ecommerce too early — before you can fulfill — creates operational pain that no homepage redesign fixes.",
          "EuroDigital is a one-person studio founded in 2026 by David Heslop. The portfolio includes websites built for Maestros Services, AnglKiss Creations, Vancouver Island Pro Roofing, and EuroPools Ltd. Those are implementation references, not price benchmarks or result claims.",
        ],
      },
      {
        heading: "What is usually included in a full launch",
        paragraphs: [
          "Business Website and Online Store essentials typically include professional mobile-first design, clear pages and calls to action, a contact or inquiry flow suited to the project, Google Analytics and Search Console, basic SEO plus domain and hosting setup, and a clear handoff of accounts and files.",
          "Ongoing marketing retainers are not required to complete a launch. Optional follow-on work can be quoted when it is genuinely useful.",
        ],
      },
      {
        heading: "Next step",
        paragraphs: [
          "If you want a written estimate, send what your business does, who it serves, whether you need a repair or a launch, and any timing constraints. Related reading: the Island website design page, the repairs page, and the redesign-versus-new-site guide.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/website-design-vancouver-island", label: "Island website design" },
      { href: "/small-website-repairs", label: "Small website repairs" },
      { href: "/#packages", label: "Homepage packages" },
      { href: "/blog/website-redesign-or-new-website", label: "Redesign or new website?" },
    ],
  },
  {
    slug: "google-business-profile-checklist-vancouver-island",
    path: "/blog/google-business-profile-checklist-vancouver-island",
    title: "Google Business Profile checklist for Vancouver Island owners",
    description:
      "A practical Google Business Profile checklist for Victoria and Vancouver Island small businesses — categories, service area, hours, website link, photos, and alignment with your site — without ranking guarantees.",
    publishedAt: "2026-10-15",
    eyebrow: "Local presence",
    sections: [
      {
        paragraphs: [
          "Your Google Business Profile is often the first thing a Victoria or Vancouver Island customer sees after a search. If hours are wrong, the website link is broken, or the categories do not match what you do, you can lose the call before your homepage ever loads.",
          "This checklist is for owners who want a practical pass — whether you do it yourself or ask EuroDigital for setup help. It does not promise map-pack rankings, review counts, or traffic numbers.",
        ],
      },
      {
        heading: "1) Confirm you can access and verify the Profile",
        paragraphs: [
          "Find out who owns the Profile. If a former contractor, employee, or agency holds access, recover it before you redesign anything. Verification must complete for full control; some business types and situations have limitations outside anyone’s control.",
          "Keep recovery emails and phone numbers current so you are not locked out later.",
        ],
      },
      {
        heading: "2) Match the business name and categories to reality",
        paragraphs: [
          "Use the name customers recognize. Avoid keyword stuffing in the title. Pick a primary category that reflects the main offer, then add secondary categories only when they are truly accurate.",
          "A landscaper is not also a restaurant because someone once mowed near a patio. Accurate categories help the right people find you; fantasy categories create the wrong expectations.",
        ],
      },
      {
        heading: "3) Set service area, hours, phone, and website correctly",
        paragraphs: [
          "Service-area businesses should describe where they actually work — Greater Victoria, South Island, or wider Vancouver Island — without inventing coverage. Storefront businesses should use the real public location details that match how customers visit.",
          "EuroDigital’s own public site uses locality only (Victoria & Vancouver Island) without publishing a street address. Your Profile should follow what is accurate for your business type.",
          "Double-check the phone number and website URL. Tap Call and open the site from a phone. Fix mismatches between the Profile and the website contact details in the same pass.",
        ],
      },
      {
        heading: "4) Write a clear description and keep offers honest",
        paragraphs: [
          "Explain what you do, who you help, and what happens next (call, quote request, book, buy). Do not invent awards, rankings, or guarantees.",
          "If you run promotions, keep them current. An expired offer on the Profile trains customers to distrust the rest of your details.",
        ],
      },
      {
        heading: "5) Add photos you own — and skip the stock clutter",
        paragraphs: [
          "Upload real photos of your work, team, or products when you have permission to use them. A few honest images beat a pile of generic stock.",
          "Update photos when the business changes. An outdated truck wrap or retired service line creates confusion.",
        ],
      },
      {
        heading: "6) Align the website with the Profile",
        paragraphs: [
          "Titles, service pages, and contact information on the site should agree with the Profile. If the site is unclear, broken, or missing a contact path, fix that too — Profile polish cannot rescue a dead website.",
          "Prefer one substantial, truthful website with clear service-area language over thin doorway pages for every Island town.",
        ],
      },
      {
        heading: "7) Reviews and questions — respond, do not manipulate",
        paragraphs: [
          "Reply to real reviews when you can, including critical ones, with factual courtesy. Do not buy fake reviews or run schemes that filter people into private channels before they can leave public feedback.",
          "EuroDigital does not sell review-volume guarantees. Ownership of your Profile responses stays with you after any setup help.",
        ],
      },
      {
        heading: "When to get help",
        paragraphs: [
          "If you need Profile setup or cleanup in Victoria, see the dedicated service page. If the website itself needs metadata fixes or contact-path repairs, Small Website Repairs start from $125 CAD for narrowly scoped work. Larger launches use the published Business Website and related packages.",
        ],
      },
    ],
    relatedLinks: [
      {
        href: "/google-business-profile-setup-victoria",
        label: "GBP setup in Victoria",
      },
      { href: "/seo-services-vancouver-island", label: "Practical SEO" },
      { href: "/small-website-repairs", label: "Small website repairs" },
      { href: "/website-design-vancouver-island", label: "Island website design" },
    ],
  },
  {
    slug: "website-redesign-or-new-website",
    path: "/blog/website-redesign-or-new-website",
    title: "Website redesign or new website? An honest decision guide",
    description:
      "How Victoria and Vancouver Island business owners can choose between a small repair, a redesign, or a new website — using EuroDigital’s project-based packages without ranking myths or pressure tactics.",
    publishedAt: "2026-10-15",
    eyebrow: "Decision guide",
    sections: [
      {
        paragraphs: [
          "Owners usually ask the wrong first question: “How much is a redesign?” The better question is: “What is stopping customers from trusting us and taking the next step?” Sometimes the answer is a broken button. Sometimes it is an information architecture that cannot be saved. Sometimes it is a one-page site that never grew up with the business.",
          "This guide is how EuroDigital thinks about repair versus redesign versus new build. It is written for Victoria and Vancouver Island small businesses, from a one-person studio that would rather recommend the smallest adequate fix than sell a rebuild you do not need.",
        ],
      },
      {
        heading: "Choose a small repair when the foundation is fine",
        paragraphs: [
          "Pick Small Website Repairs when the site structure is basically sound and the problem is narrow: typos, outdated service copy, page titles, broken links, minor layout issues, or a contact form that needs a small fix.",
          "Published starting price: from $125 CAD for narrowly scoped existing-site work. Platform and access can change the quote. A new website is not $125.",
          "If someone tries to turn that list into a twelve-page redesign proposal without explaining why, ask them to separate the must-fix items from the nice-to-haves.",
        ],
      },
      {
        heading: "Choose a redesign when structure and trust are failing",
        paragraphs: [
          "Redesign when customers cannot tell what you do, the site fails on a phone, the visual language looks abandoned, or the page structure no longer matches the business — but the domain and some brand assets are still worth keeping.",
          "Many of those projects fit the Business Website starting point from $1,250 CAD: several clear pages, trust content, inquiry path, and practical launch setup. Lean situations may fit One-Page Launch from $499 CAD. Stores that need cart and checkout belong on Online Store from $2,000 CAD.",
          "A redesign should change how people understand and contact you. Colour recreation alone is not a strategy.",
        ],
      },
      {
        heading: "Choose a new website when the old foundation costs more than a rebuild",
        paragraphs: [
          "Start fresh when the CMS is brittle, templates fight every edit, plugins create constant breakage, or migrating content into the old system would cost more than rebuilding on a maintainable foundation.",
          "Publicly you may still call it a “refresh.” Internally it is a new site with redirects and a content move plan. Custom Project pricing applies when migrations, booking, subscriptions, or unusual integrations exceed a standard package.",
        ],
      },
      {
        heading: "Signals that usually decide the path",
        paragraphs: [],
        list: [
          "Only a few concrete defects → repair",
          "Offer is unclear or mobile experience is poor, but brand/domain stay → redesign",
          "Editing the current site is slower than rebuilding → new website",
          "You need cart, checkout, and payments → ecommerce package, not a brochure redesign with a wish",
          "You need ranking guarantees → that is not a EuroDigital deliverable on any path",
        ],
      },
      {
        heading: "What not to optimize for",
        paragraphs: [
          "Do not choose a path because a competitor has more pages, because a template sale ends Friday, or because an agency promised first-page rankings after a redesign. Choose the path that removes the real friction for Island customers who mostly decide on a phone.",
          "Portfolio context without invented results: EuroDigital has built websites for Maestros Services, AnglKiss Creations, Vancouver Island Pro Roofing, and EuroPools Ltd. Inspect live work and case studies for implementation proof, not fabricated lift percentages.",
        ],
      },
      {
        heading: "Next step",
        paragraphs: [
          "Send your current URL, what feels broken, and what customers need to do. You should get an honest recommendation — repair, redesign, or new build — with a written scope before anyone starts decorating.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/website-redesign-vancouver-island", label: "Website redesign" },
      { href: "/small-website-repairs", label: "Small website repairs" },
      { href: "/blog/website-cost-victoria-bc", label: "Website cost guide" },
      { href: "/website-design-vancouver-island", label: "Island website design" },
    ],
  },
] as const;

export const BLOG_PATHS = blogPosts.map((post) => post.path);

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
