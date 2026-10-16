import { ServiceLandingView } from "@/components/ServiceLandingView";
import { seoServicesContent } from "@/lib/service-pages/seo-services-vancouver-island";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(seoServicesContent);

export default function SeoServicesPage() {
  return <ServiceLandingView content={seoServicesContent} />;
}
