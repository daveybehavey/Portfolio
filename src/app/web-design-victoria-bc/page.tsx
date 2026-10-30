import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignVictoriaContent } from "@/lib/service-pages/web-design-victoria-bc";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignVictoriaContent);

export default function WebDesignVictoriaPage() {
  return <ServiceLandingView content={webDesignVictoriaContent} />;
}
