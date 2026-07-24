export const SITE_URL = "https://eurodigital.ca" as const;

export const CONTACT_EMAIL = "contact@eurodigital.ca" as const;

export const SITE_TAGLINE =
  "Small business launches · Vancouver Island" as const;

export const BRAND_LOGO_MARK = "/brand/logo-mark.webp" as const;

export const BRAND_LOGO_SQUARE = "/brand/logo.png" as const;

export const SITE_DESCRIPTION =
  "EuroDigital builds clean, practical websites and working online stores for small businesses on Vancouver Island — lead sites, brand launches, and ecommerce setup with Google, email forwarding, analytics, basic SEO, and handoff." as const;

export const defaultOpenGraph = {
  siteName: "EuroDigital",
  locale: "en_CA",
  type: "website" as const,
  url: SITE_URL,
};

export const CONTACT_REPLY_NOTE =
  "I usually reply within 1–2 business days. One-off website launches — not ongoing IT or monthly marketing unless we agree otherwise." as const;
