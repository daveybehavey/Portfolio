"use client";

import { useId, useState } from "react";
import { ButtonLink } from "@/components/Button";
import {
  NEED_FOCUS_OPTIONS,
  type NeedFocus,
  type SitePresence,
  SITE_PRESENCE_OPTIONS,
  recommendWebsiteNeed,
  websiteNeedContactHref,
} from "@/lib/website-needs";

function OptionButton({
  selected,
  label,
  hint,
  onSelect,
  name,
  value,
}: {
  selected: boolean;
  label: string;
  hint: string;
  onSelect: () => void;
  name: string;
  value: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      name={name}
      value={value}
      onClick={onSelect}
      className={[
        "group flex min-h-[44px] w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]",
        selected
          ? "border-indigo-300 bg-indigo-50/80 shadow-sm shadow-indigo-900/5"
          : "border-slate-200/90 bg-white/70 hover:border-slate-300 hover:bg-white",
      ].join(" ")}
    >
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <span className="mt-0.5 text-xs leading-relaxed text-slate-600">{hint}</span>
    </button>
  );
}

export function WebsiteNeedsConfigurator() {
  const baseId = useId();
  const [presence, setPresence] = useState<SitePresence | null>(null);
  const [focus, setFocus] = useState<NeedFocus | null>(null);

  const recommendation =
    presence && focus ? recommendWebsiteNeed(presence, focus) : null;

  const focusOptions = presence ? NEED_FOCUS_OPTIONS[presence] : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/85 shadow-sm shadow-slate-900/5">
      <div className="border-b border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-white px-5 py-5 sm:px-7 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700/90">
          Interactive guide
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          What are you working with?
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Answer two quick questions for a fit recommendation and starting-price
          range. This qualifies scope — it does not generate a binding quote.
        </p>
      </div>

      <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8">
        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold text-slate-900">
            1. Current website
          </legend>
          <div
            role="radiogroup"
            aria-label="Do you already have a website?"
            className="mt-3 grid gap-2 sm:grid-cols-2"
          >
            {SITE_PRESENCE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                name={`${baseId}-presence`}
                value={option.value}
                label={option.label}
                hint={option.hint}
                selected={presence === option.value}
                onSelect={() => {
                  setPresence(option.value);
                  setFocus(null);
                }}
              />
            ))}
          </div>
        </fieldset>

        {presence ? (
          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold text-slate-900">
              2. What matters most right now?
            </legend>
            <div
              role="radiogroup"
              aria-label="Primary website need"
              className="mt-3 grid gap-2 sm:grid-cols-2"
            >
              {focusOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  name={`${baseId}-focus`}
                  value={option.value}
                  label={option.label}
                  hint={option.hint}
                  selected={focus === option.value}
                  onSelect={() => setFocus(option.value)}
                />
              ))}
            </div>
          </fieldset>
        ) : null}

        <div
          className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-6"
          aria-live="polite"
        >
          {recommendation ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Recommended fit
                </p>
                <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  {recommendation.title}
                </h4>
                <p className="mt-1 text-sm font-medium text-indigo-700">
                  {recommendation.startingAround}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {recommendation.summary}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {recommendation.fitNote}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  {recommendation.disclaimer}
                </p>
              </div>
              <ButtonLink
                href={websiteNeedContactHref(recommendation.projectType)}
                className="w-full shrink-0 lg:w-auto"
                magnetic
                analyticsLocation="packages"
                analyticsLabel={recommendation.ctaLabel}
              >
                {recommendation.ctaLabel}
              </ButtonLink>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-slate-600">
              Choose your situation above. Your recommendation and a contact
              shortcut will appear here — with no personal data collected in this
              step.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
