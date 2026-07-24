import { Card } from "@/components/Card";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import {
  COST_SNAPSHOT,
  SHOPIFY_BASIC_CAD,
  WHY_CHOOSE_INTRO,
  WHY_CHOOSE_POINTS,
} from "@/lib/why-choose";

export function WhyChooseSection() {
  return (
    <Section
      id="why-us"
      eyebrow="Why EuroDigital"
      title="A store that sells — without a Shopify-sized monthly bill."
      subtitle={WHY_CHOOSE_INTRO}
    >
      <Reveal>
        <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/40 via-white to-teal-50/30 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {COST_SNAPSHOT.headline}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {COST_SNAPSHOT.shopifyNote}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {COST_SNAPSHOT.eurodigitalNote}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-sm text-slate-700">
              <div className="font-medium text-slate-900">Quick reference</div>
              <ul className="mt-3 grid gap-2">
                <li>
                  <span className="font-medium text-slate-800">Shopify Basic (CAD):</span>{" "}
                  ${SHOPIFY_BASIC_CAD.monthly}/mo monthly · ~${SHOPIFY_BASIC_CAD.yearlyPerMonth}
                  /mo yearly
                </li>
                <li>
                  <span className="font-medium text-slate-800">EuroDigital:</span> one-time
                  launch + lower ongoing hosting (typical small shop)
                </li>
                <li>
                  <span className="font-medium text-slate-800">Both:</span> payment processing
                  per sale (Stripe, Square, etc.)
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                {COST_SNAPSHOT.disclaimer}{" "}
                <a
                  href={SHOPIFY_BASIC_CAD.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {SHOPIFY_BASIC_CAD.sourceLabel}
                </a>
              </p>
            </div>
          </div>
        </Card>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_CHOOSE_POINTS.map((point, idx) => (
          <Reveal key={point.title} delay={0.03 * idx}>
            <Card className="h-full p-6 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/55 motion-reduce:hover:translate-y-0">
              <div className="text-base font-semibold text-slate-900">{point.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{point.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
