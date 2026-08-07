import { PACKAGES, FULL_LAUNCH_INCLUDES } from "@/lib/offer";

export const SERVICE_LANDING_PATH =
  "/website-design-vancouver-island" as const;

export const SERVICE_LANDING_TITLE =
  "Website design for Vancouver Island small businesses" as const;

export const SERVICE_LANDING_DESCRIPTION =
  "EuroDigital plans and launches professional websites for Vancouver Island trades, service businesses, makers, and small shops — clear scope, practical Google setup, starting prices you can evaluate, and a handoff you own." as const;

export const SERVICE_WHO_FITS = [
  "Trades, contractors, landscapers, cleaners, repair businesses, and other local services that need credibility and an easy quote or call path",
  "Professionals and growing brands that need several clear pages rather than a one-page placeholder",
  "Makers and small shops that need a polished story, product or service showcase, and inquiry path",
  "Owners ready to decide pages, content roles, and timing so a written scope can stay honest",
] as const;

export const SERVICE_WHO_DOES_NOT_FIT = [
  "Teams looking for an ongoing monthly marketing or SEO retainer as the default engagement",
  "Projects that need enterprise redesign programs, large multi-brand platforms, or year-long discovery",
  "Buyers wanting ranking, traffic, or sales guarantees instead of scoped deliverables",
  "Situations where there is no workable content owner and no willingness to set exclusions",
] as const;

export const SERVICE_DELIVERABLES = [
  "Written scope covering pages, customer actions, setup work, timeline, exclusions, and price",
  "Mobile-first design focused on credibility, services or products, and clear calls to action",
  "Contact, quote-request, or purchase path matched to the package",
  "Practical launch setup: domain/hosting connection, Analytics and Search Console when in scope, Business Profile support when it fits",
  "Launch notes and a handoff that keeps ownership understandable",
] as const;

export const SERVICE_EXCLUSIONS = [
  "Vague SEO retainers or promised ranking positions",
  "Unlimited redesign cycles outside the written scope",
  "Copywriting or photography packages unless separately quoted",
  "Ongoing ads management, CRM administration, or hosting babysitting unless separately agreed",
] as const;

export const SERVICE_DEPENDENCIES = [
  "Business details, services or products, service area, and any must-have pages",
  "Logo, photos, and copy ownership decisions — rough notes are fine at first",
  "Domain registrar and hosting access when EuroDigital is connecting them",
  "Timely review feedback so launch dates stay realistic",
] as const;

export const SERVICE_LOCAL_CONTEXT = [
  "Vancouver Island customers often decide from a phone after comparing a few local options — speed, clarity, and contact paths matter more than agency theatrics",
  "Service businesses usually win trust by explaining the offer, the area they serve, and how to request a quote without hunting through dead-end menus",
  "A practical Google Business Profile plus a coherent website is often more useful than a cluster of thin city doorway pages",
] as const;

export const SERVICE_PROCESS = [
  {
    title: "1) Fit and discovery",
    body: "You share the business, customers, current setup, goals, and a few references. I confirm whether the project fits and what information is still missing.",
  },
  {
    title: "2) Written scope",
    body: "We lock the pages, customer actions, content responsibilities, setup work, timeline, exclusions, and price before the build expands.",
  },
  {
    title: "3) Build and review",
    body: "The site is designed mobile-first around credibility, services or products, clear calls to action, and a practical search-friendly structure.",
  },
  {
    title: "4) Launch and handoff",
    body: "Domain, hosting, analytics, Search Console, account access, launch notes, and a walkthrough are organized so you understand what you own.",
  },
] as const;

export const SERVICE_FAQS = [
  {
    q: "Do you only work with Vancouver Island businesses?",
    a: "Vancouver Island small businesses are the core focus and the audience this page is written for. Remote-friendly projects can be considered when the fit is clear, but the standard offer is shaped around local service credibility, practical Google setup, and a handoff you can operate without an agency maze.",
  },
  {
    q: "What are the starting prices?",
    a: `One-Page Launch starts at ${PACKAGES[0].price.replace("From ", "")}, Business Website at ${PACKAGES[1].price.replace("From ", "")}, and Online Store at ${PACKAGES[2].price.replace("From ", "")}. They are starting points for a defined scope. Content volume, integrations, product count, migrations, and unusual requirements can change the quote. You receive written deliverables and a price before work starts.`,
  },
  {
    q: "Will you create a separate page for every Island town?",
    a: "No. EuroDigital prefers one substantial, truthful service page plus clear service-area language when it helps customers — not a set of thin near-duplicate city doorway pages that mainly exist for keywords.",
  },
  {
    q: "What do you need from me before build work starts?",
    a: "Enough detail to write an honest scope: what you do, who you serve, the pages that matter, content ownership, timing, and any must-have integrations. Rough notes are fine. Missing decisions are called out as dependencies rather than guessed away.",
  },
  {
    q: "Is ongoing marketing included?",
    a: "No. The standard offer is a one-time scoped website launch. Ongoing updates, maintenance, content, or marketing can be quoted separately when they are genuinely useful, but they are not required to keep the project relationship alive.",
  },
  {
    q: "Can I see real examples first?",
    a: "Yes. Review the live MaestrosServices and StarMapCo case studies and the portfolio index. Those pages explain relationship context, implementation, live proof links, and what is deliberately not claimed.",
  },
] as const;

export const SERVICE_PACKAGE_SUMMARY = PACKAGES.map((pkg) => ({
  name: pkg.name,
  price: pkg.price,
  bestFor: pkg.bestFor,
  badge: "badge" in pkg ? pkg.badge : undefined,
  highlight: "highlight" in pkg ? pkg.highlight : undefined,
}));

export { FULL_LAUNCH_INCLUDES, PACKAGES };
