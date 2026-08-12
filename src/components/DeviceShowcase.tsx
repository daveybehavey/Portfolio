"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export type DeviceMode = "desktop" | "tablet" | "mobile";

export type DeviceViewportImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

const MODES: ReadonlyArray<{
  value: DeviceMode;
  label: string;
  frameClass: string;
  /** Capture viewport used for the screenshot (CSS pixels). */
  captureLabel: string;
}> = [
  {
    value: "desktop",
    label: "Desktop",
    frameClass: "w-full max-w-[720px]",
    captureLabel: "1440×900",
  },
  {
    value: "tablet",
    label: "Tablet",
    frameClass: "w-full max-w-[420px]",
    captureLabel: "768×1024",
  },
  {
    value: "mobile",
    label: "Mobile",
    frameClass: "w-full max-w-[min(100%,320px)]",
    captureLabel: "390×844",
  },
];

type DeviceShowcaseProps = {
  images: Record<DeviceMode, DeviceViewportImage>;
  siteUrl: string;
  projectName: string;
};

export function DeviceShowcase({
  images,
  siteUrl,
  projectName,
}: DeviceShowcaseProps) {
  const id = useId();
  const groupName = `${id}-device`;
  const reducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<DeviceMode>("desktop");
  const active = MODES.find((entry) => entry.value === mode) ?? MODES[0];
  const activeImage = images[mode];
  const host = (() => {
    try {
      return new URL(siteUrl).host;
    } catch {
      return siteUrl.replace(/^https?:\/\//, "");
    }
  })();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/85 p-3 shadow-sm shadow-slate-900/5 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700/90">
            Live viewport captures
          </p>
          <h3 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            {projectName} at real device widths
          </h3>
          <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">
            Real above-the-fold screenshots — not one image cropped into a
            smaller frame.
          </p>
        </div>

        <fieldset className="min-w-0 shrink-0">
          <legend className="sr-only">
            Screenshot viewport for {projectName}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((entry) => {
              const selected = entry.value === mode;
              const inputId = `${groupName}-${entry.value}`;
              return (
                <label
                  key={entry.value}
                  htmlFor={inputId}
                  className={[
                    "inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                    "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/35 has-[:focus-visible]:ring-offset-2",
                    selected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  ].join(" ")}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={groupName}
                    value={entry.value}
                    checked={selected}
                    onChange={() => setMode(entry.value)}
                    className="sr-only"
                  />
                  {entry.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="mt-3 flex justify-center rounded-xl bg-slate-100/70 px-1.5 py-3 sm:px-3 sm:py-4">
        <div
          className={[
            active.frameClass,
            "overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-[0_14px_32px_-24px_rgba(15,23,42,0.4)]",
            reducedMotion ? "" : "transition-[max-width] duration-300 ease-out",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <div className="flex gap-1" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
            </div>
            <div
              className="min-w-0 flex-1 truncate rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[11px] text-slate-500"
              title={siteUrl}
            >
              {host}
            </div>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:inline">
              {active.captureLabel}
            </span>
          </div>

          <div className="relative w-full bg-slate-100">
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              width={activeImage.width}
              height={activeImage.height}
              className="h-auto w-full"
              sizes={
                mode === "mobile"
                  ? "320px"
                  : mode === "tablet"
                    ? "420px"
                    : "(min-width: 1024px) 720px, 100vw"
              }
              priority={mode === "desktop"}
            />
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Static live-homepage captures at desktop, tablet, and mobile widths.
        Open the live site for the full interactive experience.
      </p>
    </div>
  );
}
