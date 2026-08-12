"use client";

import { useId, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * Labeled design demonstration — not a real client before/after history.
 * Uses CSS clip + range input; no image fabrication of past projects.
 */

function BeforeMock() {
  return (
    <div className="flex h-full min-h-[280px] flex-col bg-[#f3f3f3] text-[#222] sm:min-h-[340px]">
      <div className="border-b border-[#ccc] bg-[#e8e8e8] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#555]">
        LocalBiz Homepage
      </div>
      <div className="grid flex-1 gap-3 p-3 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <div className="h-4 w-2/3 bg-[#d0d0d0]" />
          <div className="h-3 w-full bg-[#ddd]" />
          <div className="h-3 w-5/6 bg-[#ddd]" />
          <div className="mt-4 space-y-1.5 text-[11px] leading-snug text-[#444]">
            <p>Welcome to our website!!</p>
            <p>We do services. Call us sometime.</p>
            <p className="text-[#06c] underline">Click here</p>
            <p className="text-[#06c] underline">More info</p>
          </div>
          <div className="mt-4 inline-block rounded-sm border border-[#999] bg-[#eee] px-2 py-1 text-[10px] text-[#333]">
            submit
          </div>
        </div>
        <div className="hidden flex-col gap-2 sm:flex">
          <div className="aspect-square bg-[#cfcfcf]" />
          <div className="h-2 w-full bg-[#ddd]" />
          <div className="h-2 w-4/5 bg-[#ddd]" />
          <div className="mt-auto border border-[#bbb] bg-white p-2 text-[9px] leading-tight text-[#666]">
            Flash intro · Under construction · Best viewed in IE
          </div>
        </div>
      </div>
      <div className="border-t border-[#ccc] bg-[#e0e0e0] px-3 py-1.5 text-[9px] text-[#666]">
        © LocalBiz · sitemap · guestbook
      </div>
    </div>
  );
}

function AfterMock() {
  return (
    <div className="flex h-full min-h-[280px] flex-col bg-[#fbfaf7] text-slate-900 sm:min-h-[340px]">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <div className="text-sm font-semibold tracking-tight">Island Craft Co.</div>
        <div className="hidden gap-4 text-[11px] font-medium text-slate-600 sm:flex">
          <span>Services</span>
          <span>Work</span>
          <span>Contact</span>
        </div>
        <div className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white">
          Get a quote
        </div>
      </div>
      <div className="grid flex-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5">
        <div className="flex flex-col justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
            Vancouver Island
          </p>
          <h4 className="mt-2 text-lg font-semibold leading-snug tracking-tight sm:text-xl">
            Outdoor projects that look finished — and get booked.
          </h4>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
            Clear services, trust proof, and a quote path that works on a phone
            between jobs.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white">
              Request a quote
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-800">
              Call now
            </span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100">
          <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur-sm">
            <div className="text-[10px] font-semibold text-slate-900">
              Same-week site visits
            </div>
            <div className="mt-1 text-[9px] text-slate-600">
              Nanaimo · Parksville · Courtenay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BeforeAfterCompare() {
  const id = useId();
  const reducedMotion = usePrefersReducedMotion();
  const [position, setPosition] = useState(52);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(96, Math.max(4, next)));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/85 shadow-sm shadow-slate-900/5">
      <div className="border-b border-amber-200/70 bg-amber-50/80 px-5 py-4 sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900/85">
          Design demonstration
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800">
          Illustrative mock comparison — not a historical EuroDigital client
          transformation, and not a claim about any live project.
        </p>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-end justifying-between gap-3">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              What “outdated” vs “credible” feels like
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Drag the handle to compare a weak generic layout with a clearer,
              mobile-ready presentation local customers can trust.
            </p>
          </div>
          <div className="flex gap-2 text-[11px] font-semibold uppercase tracking-wider">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
              Before
            </span>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-800">
              After
            </span>
          </div>
        </div>

        <div
          ref={trackRef}
          className="relative mt-5 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100 shadow-inner"
          onPointerDown={(event) => {
            dragging.current = true;
            (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
            setFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (!dragging.current) return;
            setFromClientX(event.clientX);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        >
          <div aria-hidden className="pointer-events-none">
            <AfterMock />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath: `inset(0 ${100 - position}% 0 0)`,
              transition: reducedMotion ? undefined : "clip-path 40ms linear",
            }}
          >
            <BeforeMock />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.18)]"
            style={{ left: `${position}%` }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md"
            style={{ left: `${position}%` }}
          >
            <span className="text-xs font-semibold tracking-tight">⟷</span>
          </div>

          <label className="sr-only" htmlFor={id}>
            Compare before and after mock layouts
          </label>
          <input
            id={id}
            type="range"
            min={4}
            max={96}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
            aria-valuemin={4}
            aria-valuemax={96}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)} percent before view`}
          />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Use the slider or keyboard arrows on the comparison control. Important
          sales copy on this page stays available without the demo.
        </p>
      </div>
    </div>
  );
}
