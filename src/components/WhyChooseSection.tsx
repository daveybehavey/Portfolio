import { Card } from "@/components/Card";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import {
  WHY_CHOOSE_HIGHLIGHT,
  WHY_CHOOSE_INTRO,
  WHY_CHOOSE_POINTS,
} from "@/lib/why-choose";

export function WhyChooseSection() {
  return (
    <Section
      id="why-us"
      eyebrow="Why EuroDigital"
      title="A professional launch without the agency maze."
      subtitle={WHY_CHOOSE_INTRO}
    >
      <Reveal>
        <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/40 via-white to-teal-50/30 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="text-xl font-semibold tracking-tight text-slate-900">
                {WHY_CHOOSE_HIGHLIGHT.headline}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                {WHY_CHOOSE_HIGHLIGHT.body}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-sm text-slate-700">
              <div className="font-medium text-slate-900">What that means</div>
              <ul className="mt-3 grid gap-2.5">
                {WHY_CHOOSE_HIGHLIGHT.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
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