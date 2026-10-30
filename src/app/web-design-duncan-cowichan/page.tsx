import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignDuncanContent } from "@/lib/service-pages/web-design-duncan-cowichan";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignDuncanContent);

export default function WebDesignDuncanPage() {
  return <ServiceLandingView content={webDesignDuncanContent} />;
}
