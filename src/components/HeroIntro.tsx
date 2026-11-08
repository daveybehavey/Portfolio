"use client";

import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/Button";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const badges = [
  "Victoria & Vancouver Island",
  "Websites + growth systems",
  "Repairs from $125",
  "Clear scope · measurable setup",
] as const;

const titleLines = [
  "Build a stronger website.",
  "Get found more clearly.",
  "Measure what improves.",
] as const;

const subtext =
  "EuroDigital builds fast, mobile-friendly websites and practical growth foundations for local businesses — with clear offers, search-friendly structure, analytics, and accounts you control.";

const footerLine =
  "Small live-site repairs from $125 CAD when that’s enough. Larger projects can include search, analytics, conversion, and ongoing improvement support without requiring a long-term retainer.";

export function HeroIntro() {
  const reduced = usePrefersReducedMotion();
  const motionClass = reduced
    ? ""
    : "motion-safe:animate-[hero-fade-up_0.5s_cubic-bezier(0.2,0.8,0.2,1)_both]";

  const delay = (seconds: number) =>
    reduced
      ? undefined
      : ({ animationDelay: `${seconds}s` } as React.CSSProperties);

  return (
    <div className="lg:col-span-7">
      <div>
        <div
          className={`flex flex-wrap gap-2 ${motionClass}`}
          style={delay(0.04)}
        >
          {badges.map((badge) => (
            <Badge key={badge}>{badge}</Badge>
          ))}
        </div>

        <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:mt-5 sm:text-6xl sm:leading-[1.05]">
          {titleLines.map((line, idx) => (
            <span
              key={line}
              className={`block ${motionClass}`}
              style={delay(0.04 + 0.09 + idx * 0.055)}
            >
              {line}
            </span>
          ))}
        </h1>

        <p
          className={`mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-slate-700 sm:text-xl ${motionClass}`}
          style={delay(0.04 + 0.09 + titleLines.length * 0.055)}
        >
          {subtext}
        </p>

        <div
          className={`mt-6 flex flex-wrap items-center gap-3 ${motionClass}`}
          style={delay(0.04 + 0.09 + titleLines.length * 0.055 + 0.09)}
        >
          <ButtonLink
            href="#contact"
            magnetic
            analyticsLocation="hero"
            analyticsLabel="Request a project estimate"
          >
            Request a project estimate
          </ButtonLink>
          <ButtonLink
            href="/website-design-vancouver-island"
            variant="secondary"
            analyticsLocation="hero"
            analyticsLabel="Island website design"
          >
            Island website design
          </ButtonLink>
          <ButtonLink
            href="#examples"
            variant="secondary"
            analyticsLocation="hero"
            analyticsLabel="See live work"
          >
            See live work
          </ButtonLink>
        </div>

        <p
          className={`mt-4 text-sm leading-relaxed text-slate-600 ${motionClass}`}
          style={delay(0.04 + 0.09 + titleLines.length * 0.055 + 0.18)}
        >
          {footerLine}
        </p>
      </div>
    </div>
  );
}
