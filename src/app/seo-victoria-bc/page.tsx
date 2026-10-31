import { ServiceLandingView } from "@/components/ServiceLandingView";
import { seoVictoriaContent } from "@/lib/service-pages/seo-victoria-bc";
import { servicePageMetadata } from "@/lib/service-page-metadata";

export const metadata = servicePageMetadata(seoVictoriaContent);

export default function SeoVictoriaBcPage() {
  return <ServiceLandingView content={seoVictoriaContent} />;
}
