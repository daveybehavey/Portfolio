import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignCampbellRiverContent } from "@/lib/service-pages/web-design-campbell-river";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignCampbellRiverContent);

export default function WebDesignCampbellRiverPage() {
  return <ServiceLandingView content={webDesignCampbellRiverContent} />;
}
