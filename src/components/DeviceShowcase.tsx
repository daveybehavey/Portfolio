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
    captureLabel: "1440×900 capture",
  },
  {
    value: "tablet",
    label: "Tablet",
    frameClass: "w-full max-w-[420px]",
    captureLabel: "768×1024 capture",
  },
  {
    value: "mobile",
    label: "Mobile",
    frameClass: "w-full max-w-[280px]",
    captureLabel: "390×844 capture",
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
    <div className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm shadow-slate-900/5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700/90">
            Viewport screenshots
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            How {projectName} looks at real device widths
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            Each option shows a real above-the-fold screenshot of the live site,
            captured at that viewport — not one image cropped into a smaller
            frame.
          </p>
        </div>

        <fieldset className="min-w-0">
          <legend className="sr-only">
            Screenshot viewport for {projectName}
          </legend>
          <div className="flex flex-wrap gap-2">
            {MODES.map((entry) => {
              const selected = entry.value === mode;
              const inputId = `${groupName}-${entry.value}`;
              return (
                <label
                  key={entry.value}
                  htmlFor={inputId}
                  className={[
                    "inline-flex min-h-[44px] cursor-pointer items-center rounded-xl border px-3.5 py-2 text-sm font-medium transition",
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
              className="min-w-0 flex-1 truncate rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] text-slate-500"
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
                  ? "280px"
                  : mode === "tablet"
                    ? "420px"
                    : "(min-width: 1024px) 720px, 100vw"
              }
              priority={mode === "desktop"}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Screenshots are static captures of the live homepage at desktop
        (1440×900), tablet (768×1024), and mobile (390×844). Open the live site
        for the full interactive experience.
      </p>
    </div>
  );
}
