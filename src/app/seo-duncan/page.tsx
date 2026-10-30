import { ServiceLandingView } from "@/components/ServiceLandingView";
import { seoDuncanContent } from "@/lib/service-pages/seo-duncan";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(seoDuncanContent);

export default function SeoDuncanPage() {
  return <ServiceLandingView content={seoDuncanContent} />;
}
