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
};

export const projects: readonly Project[] = [
  {
    name: "NoteBill",
    tagline: "AI invoice app",
    url: "https://notebill.app",
    playStoreUrl: "https://play.google.com/store/apps/details?id=app.notebill.app",
    outcome:
      "NoteBill helps contractors and solo operators draft, organize, and send invoices faster — with AI-assisted wording and a workflow tuned to how people actually work.",
    bullets: ["AI-assisted invoice creation", "Designed for solo operators", "Live on Google Play"],
    label: "Featured app",
    imageSrc: "/projects/notebill.webp",
    isFeatured: true
  },
  {
    name: "StarMapCo",
    tagline: "Personalized gifts (storefront)",
    url: "https://starmapco.com",
    outcome: "Product-focused site for a personalized gift experience and conversion flow.",
    bullets: ["Product pages", "Personalization UX", "Conversion-focused sections"],
    label: "Ecommerce",
    imageSrc: "/projects/starmapco.webp"
  },
  {
    name: "MaestrosServices",
    tagline: "Landscaping business (lead-gen)",
    url: "https://maestrosservices.com",
    outcome: "Service-business site built to turn visitors into calls and quote requests.",
    bullets: ["Clear services + CTA", "Trust sections", "Mobile-first layout"],
    label: "Local services",
    imageSrc: "/projects/maestrosservices.webp"
  },
  {
    name: "AnglKissCreations",
    tagline: "Handmade products (catalog)",
    url: "https://angelkisscreations.com",
    outcome: "Small business website for showcasing products and driving inquiries and orders.",
    bullets: ["Product/gallery layout", "Fast navigation", "Simple inquiry flow"],
    label: "Small business",
    imageSrc: "/projects/angelkisscreations.webp"
  },
  {
    name: "VancouverIslandProRoofing",
    tagline: "Roofing business (early work)",
    url: "https://vancouverislandproroofing.com",
    outcome: "An early client website that shows the start of the work I build from.",
    bullets: ["Early project", "Live site", "Rebuild-ready"],
    label: "Early work",
    imageSrc: "/projects/vancouverislandproroofing.webp",
    isEarlyWork: true
  }
] as const;
