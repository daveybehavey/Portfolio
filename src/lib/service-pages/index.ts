import type { ServiceLandingContent } from "@/lib/service-landing-types";
import { ecommerceWebsitesContent } from "@/lib/service-pages/ecommerce-websites-vancouver-island";
import { googleBusinessProfileContent } from "@/lib/service-pages/google-business-profile-setup-victoria";
import { seoServicesContent } from "@/lib/service-pages/seo-services-vancouver-island";
import { smallWebsiteRepairsContent } from "@/lib/service-pages/small-website-repairs";
import { websiteRedesignContent } from "@/lib/service-pages/website-redesign-vancouver-island";

export const ADDITIONAL_SERVICE_PAGES = [
  ecommerceWebsitesContent,
  seoServicesContent,
  websiteRedesignContent,
  smallWebsiteRepairsContent,
  googleBusinessProfileContent,
] as const satisfies readonly ServiceLandingContent[];

export const ADDITIONAL_SERVICE_PATHS = ADDITIONAL_SERVICE_PAGES.map(
  (page) => page.path,
);

export {
  ecommerceWebsitesContent,
  googleBusinessProfileContent,
  seoServicesContent,
  smallWebsiteRepairsContent,
  websiteRedesignContent,
};
