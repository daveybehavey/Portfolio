import { ServiceLandingView } from "@/components/ServiceLandingView";
import { smallWebsiteRepairsContent } from "@/lib/service-pages/small-website-repairs";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(smallWebsiteRepairsContent);

export default function SmallWebsiteRepairsPage() {
  return <ServiceLandingView content={smallWebsiteRepairsContent} />;
}
