import { ServiceLandingView } from "@/components/ServiceLandingView";
import { ecommerceWebsitesContent } from "@/lib/service-pages/ecommerce-websites-vancouver-island";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(ecommerceWebsitesContent);

export default function EcommerceWebsitesPage() {
  return <ServiceLandingView content={ecommerceWebsitesContent} />;
}
