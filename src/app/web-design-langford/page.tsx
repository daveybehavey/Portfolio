import { ServiceLandingView } from "@/components/ServiceLandingView";
import { webDesignLangfordContent } from "@/lib/service-pages/web-design-langford";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(webDesignLangfordContent);

export default function WebDesignLangfordPage() {
  return <ServiceLandingView content={webDesignLangfordContent} />;
}
