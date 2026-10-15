/**
 * Vancouver Island service localities for ProfessionalService areaServed.
 * Greater Victoria / south Island municipalities (11) aligned with the owner's
 * services/areas catalog pattern — locality names only, no street addresses.
 */
export const SERVICE_AREAS = [
  "Victoria",
  "Saanich",
  "Oak Bay",
  "Esquimalt",
  "View Royal",
  "Colwood",
  "Langford",
  "Metchosin",
  "Highlands",
  "Sooke",
  "Sidney",
] as const;

export type ServiceArea = (typeof SERVICE_AREAS)[number];
