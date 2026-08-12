import { projects, type Project } from "@/lib/projects";

export type CaseStudyRelationshipKind = "family-business" | "owned-product";

export type CaseStudy = {
  slug: "maestrosservices" | "starmapco";
  path: `/projects/${string}`;
  projectName: string;
  title: string;
  description: string;
  eyebrow: string;
  relationship: {
    kind: CaseStudyRelationshipKind;
    label: string;
    disclosure: string;
  };
  problem: string;
  constraints: readonly string[];
  implementation: readonly string[];
  stack: readonly string[];
  liveProof: {
    url: string;
    summary: string;
  };
  limitations: readonly string[];
  notClaimed: readonly string[];
  imageSrc: string;
  imageAlt: string;
  /** Real live-site captures at representative CSS viewports for DeviceShowcase. */
  viewportImages: {
    desktop: { src: string; width: number; height: number; alt: string };
    tablet: { src: string; width: number; height: number; alt: string };
    mobile: { src: string; width: number; height: number; alt: string };
  };
};

function requireProject(name: string): Project {
  const project = projects.find((entry) => entry.name === name);
  if (!project) {
    throw new Error(`Missing project data for ${name}`);
  }
  return project;
}

const maestros = requireProject("MaestrosServices");
const starmap = requireProject("StarMapCo");

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "maestrosservices",
    path: "/projects/maestrosservices",
    projectName: maestros.name,
    title: "MaestrosServices — local service website case study",
    description:
      "How EuroDigital structured a mobile-first website for a family landscaping and outdoor-services business so visitors can understand the offer and request a quote.",
    eyebrow: "Case study · Local services",
    relationship: {
      kind: "family-business",
      label: "Family business website",
      disclosure:
        "MaestrosServices is a family landscaping and outdoor-services business. This case study describes website implementation work connected to that relationship. It is not an independent third-party client testimonial, and it does not claim audited business results.",
    },
    problem:
      "A local landscaping and outdoor-services business needed a clear website that explains the work, looks credible on a phone, and makes calls or quote requests easy — without pretending every visitor needs a long brochure site.",
    constraints: [
      "Content had to stay honest about services rather than inventing awards or results",
      "The primary conversion path is contact and quote requests, not ecommerce",
      "The site needed to load quickly and remain maintainable after handoff",
      "Claims on eurodigital.ca must stay limited to observable implementation and live-site structure",
    ],
    implementation: [
      "Mobile-first service pages organized around what a local customer needs to understand first",
      "Clear contact and quote-request paths rather than burying the next step",
      "Trust-focused layout with readable service explanations instead of buzzword hero copy",
      "Practical search-friendly structure and metadata suited to a local service business",
    ],
    stack: [
      "Static marketing website on a modern JAMstack delivery path",
      "Responsive layout optimized for phone-first browsing",
      "Contact and quote-request funnel for local lead generation",
      "Domain, hosting, and handoff documentation as part of launch work",
    ],
    liveProof: {
      url: maestros.url,
      summary:
        "Inspect the live site at maestrosservices.com for layout, services presentation, and contact paths. Use only what is visible there when evaluating the work.",
    },
    limitations: [
      "This page documents website implementation, not landscaping job volume or revenue",
      "Seasonal demand, quoting practices, and offline sales motion remain outside the website alone",
      "EuroDigital does not publish fabricated before/after conversion or traffic charts for this project",
    ],
    notClaimed: [
      "No invented call volume, booked jobs, ranking positions, or revenue figures",
      "No independent customer review widgets or star ratings hosted as EuroDigital proof",
      "No implication that every landscaping business should copy this exact page inventory",
    ],
    imageSrc: maestros.imageSrc,
    imageAlt: "MaestrosServices website preview",
    viewportImages: {
      desktop: {
        src: "/projects/maestrosservices-desktop.webp",
        width: 1200,
        height: 750,
        alt: "MaestrosServices homepage captured at desktop width (1440×900)",
      },
      tablet: {
        src: "/projects/maestrosservices-tablet.webp",
        width: 768,
        height: 1024,
        alt: "MaestrosServices homepage captured at tablet width (768×1024)",
      },
      mobile: {
        src: "/projects/maestrosservices-mobile.webp",
        width: 390,
        height: 844,
        alt: "MaestrosServices homepage captured at mobile width (390×844)",
      },
    },
  },
  {
    slug: "starmapco",
    path: "/projects/starmapco",
    projectName: starmap.name,
    title: "StarMapCo — owned ecommerce storefront case study",
    description:
      "How EuroDigital built StarMapCo as an owned ecommerce product and storefront with catalog, cart, checkout, and purchase flow — shown as working proof, not as an unrelated client engagement.",
    eyebrow: "Case study · Owned ecommerce",
    relationship: {
      kind: "owned-product",
      label: "Owned product / portfolio storefront",
      disclosure:
        "StarMapCo is an owned EuroDigital ecommerce product and storefront used as working proof of online-store capability. It is not presented here as an unrelated third-party client engagement.",
    },
    problem:
      "Brochure-style galleries are not enough when a business needs a real storefront. StarMapCo required product pages, collections, cart, checkout, payments, and a brand experience designed to support purchases.",
    constraints: [
      "The store had to support a complete purchase path, not just product photography",
      "Day-to-day operations (products, orders, fulfillment) needed a practical handoff shape",
      "Public EuroDigital claims must remain limited to what the live store and repository support",
      "Owned-product status must stay explicit so visitors are not misled about client relationships",
    ],
    implementation: [
      "Storefront information architecture for products, collections, and key commerce pages",
      "Cart, checkout, and payment connection suited to a real purchase flow",
      "Conversion-focused layout that keeps the next purchase step visible",
      "Analytics, domain, and hosting setup consistent with a launch-and-operate storefront",
    ],
    stack: [
      "Ecommerce storefront with product catalog and collections",
      "Cart, checkout, and payment tooling appropriate to the store’s scope",
      "Shipping, tax, and notification basics as configured for the project",
      "Mobile-first presentation with search-friendly product and category pages",
    ],
    liveProof: {
      url: starmap.url,
      summary:
        "Inspect the live storefront at starmapco.com for catalog, cart, and checkout behavior. Treat the live site as the source of truth for what currently ships.",
    },
    limitations: [
      "This case study describes storefront implementation, not monthly sales totals",
      "Catalog size, shipping rules, and payment configuration continue to evolve with the product",
      "Owned-product economics are not the same as an external merchant engagement",
    ],
    notClaimed: [
      "No invented revenue, average order value, conversion rate, or customer-count statistics",
      "No claim that StarMapCo is an arms-length client website owned by someone else",
      "No ranking, traffic, or advertising-performance guarantees attached to this storefront",
    ],
    imageSrc: starmap.imageSrc,
    imageAlt: "StarMapCo ecommerce storefront preview",
    viewportImages: {
      desktop: {
        src: "/projects/starmapco-desktop.webp",
        width: 1200,
        height: 750,
        alt: "StarMapCo homepage captured at desktop width (1440×900)",
      },
      tablet: {
        src: "/projects/starmapco-tablet.webp",
        width: 768,
        height: 1024,
        alt: "StarMapCo homepage captured at tablet width (768×1024)",
      },
      mobile: {
        src: "/projects/starmapco-mobile.webp",
        width: 390,
        height: 844,
        alt: "StarMapCo homepage captured at mobile width (390×844)",
      },
    },
  },
] as const;

export function getCaseStudy(slug: CaseStudy["slug"]): CaseStudy {
  const study = caseStudies.find((entry) => entry.slug === slug);
  if (!study) {
    throw new Error(`Unknown case study: ${slug}`);
  }
  return study;
}

export const CASE_STUDY_PATHS = caseStudies.map((study) => study.path);
