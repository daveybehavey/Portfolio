import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignNanaimoContent } from "@/lib/service-pages/web-design-nanaimo";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignNanaimoContent);

export default function WebDesignNanaimoPage() {
  return <ServiceLandingView content={webDesignNanaimoContent} />;
}
