import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignComoxValleyContent } from "@/lib/service-pages/web-design-comox-valley";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignComoxValleyContent);

export default function WebDesignComoxValleyPage() {
  return <ServiceLandingView content={webDesignComoxValleyContent} />;
}
