import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignParksvilleQualicumContent } from "@/lib/service-pages/web-design-parksville-qualicum";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignParksvilleQualicumContent);

export default function WebDesignParksvilleQualicumPage() {
  return <ServiceLandingView content={webDesignParksvilleQualicumContent} />;
}
