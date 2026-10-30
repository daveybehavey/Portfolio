import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignSookeContent } from "@/lib/service-pages/web-design-sooke-bc";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignSookeContent);

export default function WebDesignSookePage() {
  return <ServiceLandingView content={webDesignSookeContent} />;
}
