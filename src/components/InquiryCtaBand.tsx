import { ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import type { AnalyticsLocation } from "@/lib/analytics";

type InquiryCtaBandProps = {
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  analyticsLocation: AnalyticsLocation;
};

export function InquiryCtaBand({
  title,
  body,
  primaryHref = "/#contact",
  primaryLabel = "Request a project estimate",
  secondaryHref = "/projects",
  secondaryLabel = "Browse portfolio",
  analyticsLocation,
}: InquiryCtaBandProps) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={primaryHref}
            analyticsLocation={analyticsLocation}
            analyticsLabel={primaryLabel}
          >
            {primaryLabel}
          </ButtonLink>
          <ButtonLink href={secondaryHref} variant="secondary">
            {secondaryLabel}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
