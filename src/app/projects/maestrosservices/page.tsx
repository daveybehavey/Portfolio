import type { Metadata } from "next";
import { CaseStudyView } from "@/components/CaseStudyView";
import { getCaseStudy } from "@/lib/case-studies";
import { SITE_URL, defaultOpenGraph } from "@/lib/site";

const study = getCaseStudy("maestrosservices");
const pageUrl = `${SITE_URL}${study.path}`;

export const metadata: Metadata = {
  title: "MaestrosServices case study",
  description: study.description,
  alternates: { canonical: study.path },
  openGraph: {
    ...defaultOpenGraph,
    title: "MaestrosServices case study — EuroDigital",
    description: study.description,
    url: pageUrl,
    images: [
      {
        url: study.imageSrc,
        width: 1200,
        height: 630,
        alt: study.imageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MaestrosServices case study — EuroDigital",
    description: study.description,
    images: [study.imageSrc],
  },
};

export default function MaestrosCaseStudyPage() {
  return <CaseStudyView study={study} />;
}
