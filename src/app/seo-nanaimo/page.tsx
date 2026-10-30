import { ServiceLandingView } from "@/components/ServiceLandingView";
import { seoNanaimoContent } from "@/lib/service-pages/seo-nanaimo";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(seoNanaimoContent);

export default function SeoNanaimoPage() {
  return <ServiceLandingView content={seoNanaimoContent} />;
}
