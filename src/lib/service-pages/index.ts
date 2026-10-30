import type { ServiceLandingContent } from "@/lib/service-landing-types";
import { ecommerceWebsitesContent } from "@/lib/service-pages/ecommerce-websites-vancouver-island";
import { googleBusinessProfileContent } from "@/lib/service-pages/google-business-profile-setup-victoria";
import { seoCourtenayContent } from "@/lib/service-pages/seo-courtenay-bc";
import { seoDuncanContent } from "@/lib/service-pages/seo-duncan";
import { seoNanaimoContent } from "@/lib/service-pages/seo-nanaimo";
import { seoServicesContent } from "@/lib/service-pages/seo-services-vancouver-island";
import { smallWebsiteRepairsContent } from "@/lib/service-pages/small-website-repairs";
import { webDesignCampbellRiverContent } from "@/lib/service-pages/web-design-campbell-river";
import { webDesignComoxValleyContent } from "@/lib/service-pages/web-design-comox-valley";
import { webDesignDuncanContent } from "@/lib/service-pages/web-design-duncan-cowichan";
import { webDesignNanaimoContent } from "@/lib/service-pages/web-design-nanaimo";
import { webDesignSookeContent } from "@/lib/service-pages/web-design-sooke-bc";
import { webDesignVictoriaContent } from "@/lib/service-pages/web-design-victoria-bc";
import { websiteRedesignContent } from "@/lib/service-pages/website-redesign-vancouver-island";

export const ADDITIONAL_SERVICE_PAGES = [
  ecommerceWebsitesContent,
  seoServicesContent,
  websiteRedesignContent,
  smallWebsiteRepairsContent,
  googleBusinessProfileContent,
  webDesignVictoriaContent,
  webDesignNanaimoContent,
  webDesignComoxValleyContent,
  webDesignDuncanContent,
  webDesignCampbellRiverContent,
  webDesignSookeContent,
  seoNanaimoContent,
  seoCourtenayContent,
  seoDuncanContent,
] as const satisfies readonly ServiceLandingContent[];

export const ADDITIONAL_SERVICE_PATHS = ADDITIONAL_SERVICE_PAGES.map(
  (page) => page.path,
);

export {
  ecommerceWebsitesContent,
  googleBusinessProfileContent,
  seoCourtenayContent,
  seoDuncanContent,
  seoNanaimoContent,
  seoServicesContent,
  smallWebsiteRepairsContent,
  webDesignCampbellRiverContent,
  webDesignComoxValleyContent,
  webDesignDuncanContent,
  webDesignNanaimoContent,
  webDesignSookeContent,
  webDesignVictoriaContent,
  websiteRedesignContent,
};
