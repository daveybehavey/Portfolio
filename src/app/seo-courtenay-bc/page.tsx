import { ServiceLandingView } from "@/components/ServiceLandingView";
import { seoCourtenayContent } from "@/lib/service-pages/seo-courtenay-bc";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(seoCourtenayContent);

export default function SeoCourtenayPage() {
  return <ServiceLandingView content={seoCourtenayContent} />;
}
