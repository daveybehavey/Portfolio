export const SITE_URL = "https://eurodigital.ca" as const;
export const CONTACT_EMAIL = "hello@eurodigital.ca" as const;

/** One line under the wordmark in the header */
export const SITE_TAGLINE = "Websites & apps · Vancouver Island" as const;

/** Shared short pitch for meta + structured data */
export const SITE_DESCRIPTION =
  "EuroDigital is a Vancouver Island studio for modern websites and small apps — clear messaging, fast pages, and handoffs you can run yourself." as const;

export const defaultOpenGraph = {
  siteName: "EuroDigital",
  locale: "en_CA",
  type: "website" as const,
  url: SITE_URL
};
