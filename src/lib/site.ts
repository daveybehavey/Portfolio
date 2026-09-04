export const SITE_URL = "https://eurodigital.ca" as const;

export const CONTACT_EMAIL = "contact@eurodigital.ca" as const;

/** Public GBP phone — display form for customer-facing UI. */
export const CONTACT_PHONE_DISPLAY = "(778) 678-6242" as const;

/** Public GBP phone — E.164 / schema.org telephone. */
export const CONTACT_PHONE_E164 = "+17786786242" as const;

export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_E164}` as const;

/** Service-area geography for public copy (no street address). */
export const SERVICE_AREA_LABEL = "Victoria & Vancouver Island" as const;

export const SITE_TAGLINE =
  "Websites and practical growth systems for Victoria & Vancouver Island businesses" as const;

export const BRAND_LOGO_MARK = "/brand/logo-mark.webp" as const;

export const BRAND_LOGO_SQUARE = "/brand/logo.png" as const;

export const SITE_DESCRIPTION =
  "EuroDigital builds professional websites and practical digital growth systems for Victoria and Vancouver Island businesses — clear scope, search and analytics foundations, stronger customer paths, measurable setup, and a handoff you own." as const;

export const defaultOpenGraph = {
  siteName: "EuroDigital",
  locale: "en_CA",
  type: "website" as const,
  url: SITE_URL,
};

export const CONTACT_REPLY_NOTE =
  "I usually reply within 1–2 business days with fit, likely scope, and the next information needed for a written estimate." as const;
