export type Project = {
  name: string;
  tagline: string;
  url: string;
  outcome: string;
  bullets: readonly string[];
  label: string;
  imageSrc: string;
  /** Google Play listing when the project ships on Android */
  playStoreUrl?: string;
  isFeatured?: boolean;
  isEarlyWork?: boolean;
  /** Internal case-study route when a dedicated proof page exists */
  caseStudyPath?: `/projects/${string}`;
};

export const projects: readonly Project[] = [
  {
    name: "MaestrosServices",
    tagline: "Landscaping & outdoor services",
    url: "https://maestrosservices.com",
    outcome:
      "Local service business site built to explain offerings, build trust, and turn visitors into calls and quote requests.",
    bullets: [
      "Clear services + contact paths",
      "Trust-focused layout",
      "Mobile-first lead capture",
    ],
    label: "Local services",
    imageSrc: "/projects/maestrosservices.webp",
    isFeatured: true,
    caseStudyPath: "/projects/maestrosservices",
  },
  {
    name: "AnglKissCreations",
    tagline: "Handmade products & brand",
    url: "https://angelkisscreations.com",
    outcome:
      "Creative small-business site for showcasing products, sharing the brand story, and making inquiries easy.",
    bullets: ["Product showcase", "Brand story", "Simple inquiry flow"],
    label: "Creative brand",
    imageSrc: "/projects/angelkisscreations.webp",
    isFeatured: true,
  },
  {
    name: "NoteBill",
    tagline: "Side project · invoice app",
    url: "https://notebill.app",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=app.notebill.app",
    outcome:
      "A separate product I built and shipped — not the core EuroDigital offer, but proof I can deliver polished software when needed.",
    bullets: [
      "Live on Google Play",
      "AI-assisted workflows",
      "Outside the main website focus",
    ],
    label: "App (side project)",
    imageSrc: "/projects/notebill.webp",
  },
  {
    name: "StarMapCo",
    tagline: "Ecommerce · personalized gifts",
    url: "https://starmapco.com",
    outcome:
      "Working online store — product catalog, purchase flow, and a polished brand experience built to convert visitors into orders.",
    bullets: [
      "Storefront + product pages",
      "Checkout & payments setup",
      "Conversion-focused layout",
    ],
    label: "Ecommerce store",
    imageSrc: "/projects/starmapco.webp",
    caseStudyPath: "/projects/starmapco",
  },
  {
    name: "VancouverIslandProRoofing",
    tagline: "Roofing business (early work)",
    url: "https://vancouverislandproroofing.com",
    outcome:
      "An early client website that shows the start of the work I build from.",
    bullets: ["Early project", "Live site", "Rebuild-ready"],
    label: "Early work",
    imageSrc: "/projects/vancouverislandproroofing.webp",
    isEarlyWork: true,
  },
] as const;
