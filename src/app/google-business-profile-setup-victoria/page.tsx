import { ServiceLandingView } from "@/components/ServiceLandingView";
import { googleBusinessProfileContent } from "@/lib/service-pages/google-business-profile-setup-victoria";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(googleBusinessProfileContent);

export default function GoogleBusinessProfileSetupPage() {
  return <ServiceLandingView content={googleBusinessProfileContent} />;
}
