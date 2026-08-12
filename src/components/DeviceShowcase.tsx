"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export type DeviceMode = "desktop" | "tablet" | "mobile";

const MODES: ReadonlyArray<{
  value: DeviceMode;
  label: string;
  frameClass: string;
  chromeLabel: string;
}> = [
  {
    value: "desktop",
    label: "Desktop",
    frameClass: "w-full max-w-none",
    chromeLabel: "Desktop layout",
  },
  {
    value: "tablet",
    label: "Tablet",
    frameClass: "w-full max-w-[520px]",
    chromeLabel: "Tablet layout",
  },
  {
    value: "mobile",
    label: "Mobile",
    frameClass: "w-full max-w-[280px]",
    chromeLabel: "Mobile layout",
  },
];

type DeviceShowcaseProps = {
  imageSrc: string;
  imageAlt: string;
  siteUrl: string;
  projectName: string;
};

export function DeviceShowcase({
  imageSrc,
  imageAlt,
  siteUrl,
  projectName,
}: DeviceShowcaseProps) {
  const id = useId();
  const reducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<DeviceMode>("desktop");
  const active = MODES.find((entry) => entry.value === mode) ?? MODES[0];
  const host = (() => {
    try {
      return new URL(siteUrl).host;
    } catch {
      return siteUrl.replace(/^https?:\/\//, "");
    }
  })();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm shadow-slate-900/5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700/90">
            Responsive preview
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            Explore how {projectName} reads across devices
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            Switch layouts to see width and hierarchy change — the same live
            project, framed for review. Not a hardware toy.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label={`Device width for ${projectName}`}
          className="flex flex-wrap gap-2"
        >
          {MODES.map((entry) => {
            const selected = entry.value === mode;
            return (
              <button
                key={entry.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(entry.value)}
                className={[
                  "min-h-[44px] rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2",
                  selected
                    ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex justify-center rounded-xl bg-gradient-to-b from-slate-100/90 to-slate-50/40 px-2 py-6 sm:px-4 sm:py-8">
        <div
          className={[
            active.frameClass,
            "overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]",
            reducedMotion ? "" : "transition-[max-width] duration-300 ease-out",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            </div>
            <div
              id={`${id}-chrome`}
              className="min-w-0 flex-1 truncate rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] text-slate-500"
              title={siteUrl}
            >
              {host}
            </div>
            <span className="sr-only">{active.chromeLabel}</span>
          </div>

          <div
            className={[
              "relative w-full bg-slate-100",
              mode === "mobile"
                ? "aspect-[9/16] max-h-[520px]"
                : mode === "tablet"
                  ? "aspect-[4/3]"
                  : "aspect-[16/10]",
              reducedMotion ? "" : "transition-[aspect-ratio] duration-300 ease-out",
            ].join(" ")}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className={[
                "object-cover object-top",
                mode === "mobile" ? "object-[center_top]" : "",
              ].join(" ")}
              sizes={
                mode === "mobile"
                  ? "280px"
                  : mode === "tablet"
                    ? "520px"
                    : "(min-width: 1024px) 900px, 100vw"
              }
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Preview uses the same project imagery shown in this case study. Open the
        live site for the full interactive experience.
      </p>
    </div>
  );
}
