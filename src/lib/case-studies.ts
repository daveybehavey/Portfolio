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
  /** Project image views for DeviceShowcase. */
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
    title: "MaestrosServices — service-website overview",
    description: "MaestrosServices — service-website overview.",
    eyebrow: "Case study · Local services",
    relationship: {
      kind: "family-business",
      label: "Family business website",
      disclosure:
        "MaestrosServices is a family landscaping and outdoor-services business. This page is a service-website overview. It is not an independent third-party client testimonial, and it does not claim audited business results.",
    },
    problem:
      "A local landscaping and outdoor-services business needs a clear website that explains the work, looks credible on a phone, and makes calls or quote requests easy — without pretending every visitor needs a long brochure site.",
    constraints: [
      "Content had to stay honest about services rather than inventing awards or results",
      "The primary conversion path is contact and quote requests, not ecommerce",
      "Claims on eurodigital.ca must stay limited to observable implementation and live-site structure",
    ],
    implementation: [
      "Topics: service explanations, contact paths, mobile readability and metadata.",
    ],
    stack: [
      "Planning priorities: delivery approach, maintainability and handoff responsibilities.",
    ],
    liveProof: {
      url: maestros.url,
      summary: "Project URL: maestrosservices.com.",
    },
    limitations: [
      "This page covers website topics, not landscaping job volume or revenue",
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
        alt: "MaestrosServices homepage project image view (desktop)",
      },
      tablet: {
        src: "/projects/maestrosservices-tablet.webp",
        width: 768,
        height: 1024,
        alt: "MaestrosServices homepage project image view (tablet)",
      },
      mobile: {
        src: "/projects/maestrosservices-mobile.webp",
        width: 390,
        height: 844,
        alt: "MaestrosServices homepage project image view (mobile)",
      },
    },
  },
  {
    slug: "starmapco",
    path: "/projects/starmapco",
    projectName: starmap.name,
    title: "StarMapCo — ecommerce project overview",
    description: "StarMapCo — ecommerce project overview.",
    eyebrow: "Case study · Ecommerce",
    relationship: {
      kind: "owned-product",
      label: "Ecommerce project overview",
      disclosure:
        "StarMapCo is an owned EuroDigital ecommerce product. It is not presented here as an unrelated third-party client engagement.",
    },
    problem:
      "Consider product information, cart, checkout, payments and day-to-day operations when defining an ecommerce scope.",
    constraints: [
      "A storefront scope should define product maintenance, order handling and fulfillment responsibilities.",
      "Public EuroDigital claims must remain limited to what the project site and repository support",
    ],
    implementation: [
      "This overview discusses product catalogs, collections and commerce pages.",
      "Cart, checkout and payment connection are topics to verify when assessing a storefront.",
      "Design priority: make the next purchase step clear.",
      "Analytics requirements should be defined in the written scope.",
      "Domain and hosting responsibilities belong in the launch scope.",
    ],
    stack: [
      "Product catalogs, collections and commerce pages",
      "Cart, checkout and payment connection",
      "Define applicable shipping, tax and notification requirements before implementation.",
      "Design priorities: readable mobile layouts and clear product/category structure.",
    ],
    liveProof: {
      url: starmap.url,
      summary: "Project URL: starmapco.com.",
    },
    limitations: [
      "This overview covers storefront topics, not monthly sales totals",
      "This overview does not establish the current catalog, shipping rules or payment configuration.",
      "Project economics are not the same as an external merchant engagement",
    ],
    notClaimed: [
      "No revenue, conversion-rate, customer-count or ranking results are presented here.",
      "No claim that StarMapCo is an arms-length client website owned by someone else",
      "No traffic or advertising-performance guarantees attached to this overview",
    ],
    imageSrc: starmap.imageSrc,
    imageAlt: "StarMapCo ecommerce storefront preview",
    viewportImages: {
      desktop: {
        src: "/projects/starmapco-desktop.webp",
        width: 1200,
        height: 750,
        alt: "StarMapCo homepage project image view (desktop)",
      },
      tablet: {
        src: "/projects/starmapco-tablet.webp",
        width: 768,
        height: 1024,
        alt: "StarMapCo homepage project image view (tablet)",
      },
      mobile: {
        src: "/projects/starmapco-mobile.webp",
        width: 390,
        height: 844,
        alt: "StarMapCo homepage project image view (mobile)",
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
