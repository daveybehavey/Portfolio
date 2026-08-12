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

function OptionCard({
  id,
  name,
  value,
  label,
  hint,
  checked,
  onChange,
  compact = false,
}: {
  id: string;
  name: string;
  value: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
  /** Tighter padding for dense mobile grids (≥390px two-column). */
  compact?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={[
        "flex min-h-[44px] w-full cursor-pointer flex-col items-start rounded-xl border text-left transition",
        compact ? "px-3 py-2.5 sm:px-4 sm:py-3" : "px-4 py-3",
        "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/35 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[rgb(var(--bg))]",
        checked
          ? "border-indigo-300 bg-indigo-50/80 shadow-sm shadow-indigo-900/5"
          : "border-slate-200/90 bg-white/70 hover:border-slate-300 hover:bg-white",
      ].join(" ")}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-sm font-semibold leading-snug text-slate-900">
        {label}
      </span>
      <span className="mt-0.5 text-xs leading-snug text-slate-600">{hint}</span>
    </label>
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
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SITE_PRESENCE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                id={`${baseId}-presence-${option.value}`}
                name={`${baseId}-presence`}
                value={option.value}
                label={option.label}
                hint={option.hint}
                checked={presence === option.value}
                onChange={() => {
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
            <div className="mt-3 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
              {focusOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  id={`${baseId}-focus-${option.value}`}
                  name={`${baseId}-focus`}
                  value={option.value}
                  label={option.label}
                  hint={option.hint}
                  checked={focus === option.value}
                  onChange={() => setFocus(option.value)}
                  compact
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
