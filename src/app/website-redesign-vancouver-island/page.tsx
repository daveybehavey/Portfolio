import { ServiceLandingView } from "@/components/ServiceLandingView";
import { websiteRedesignContent } from "@/lib/service-pages/website-redesign-vancouver-island";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(websiteRedesignContent);

export default function WebsiteRedesignPage() {
  return <ServiceLandingView content={websiteRedesignContent} />;
}
