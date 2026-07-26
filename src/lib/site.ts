export const SITE_URL = "https://eurodigital.ca" as const;

export const CONTACT_EMAIL = "contact@eurodigital.ca" as const;

export const SITE_TAGLINE =
  "Professional websites for Vancouver Island businesses" as const;

export const BRAND_LOGO_MARK = "/brand/logo-mark.webp" as const;

export const BRAND_LOGO_SQUARE = "/brand/logo.png" as const;

export const SITE_DESCRIPTION =
  "EuroDigital designs and launches professional websites for Vancouver Island service businesses, makers, and small shops — clear scope, practical Google setup, strong customer paths, and a handoff you own." as const;

export const defaultOpenGraph = {
  siteName: "EuroDigital",
  locale: "en_CA",
  type: "website" as const,
  url: SITE_URL,
};

export const CONTACT_REPLY_NOTE =
  "I usually reply within 1–2 business days with fit, likely scope, and the next information needed for a written estimate." as const;