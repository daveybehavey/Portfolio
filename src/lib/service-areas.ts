/**
 * Vancouver Island service localities for ProfessionalService areaServed.
 * Greater Victoria / south Island municipalities plus the mid-Island
 * Oceanside communities of Parksville and Qualicum Beach (13), aligned with
 * the owner's services/areas catalog pattern — locality names only, no
 * street addresses.
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
  "Parksville",
  "Qualicum Beach",
] as const;

export type ServiceArea = (typeof SERVICE_AREAS)[number];
