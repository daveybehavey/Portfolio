"use client";

import { useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export function Accordion({
  items,
}: {
  items: ReadonlyArray<{ q: string; a: string }>;
}) {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="grid gap-3">
      {items.map((it, idx) => {
        const isOpen = open === idx;
        return (
          <details
            key={`faq-${idx}`}
            open={isOpen}
            className="group rounded-2xl border border-slate-200/85 bg-white/95 shadow-sm shadow-slate-900/[0.05] transition-colors open:border-slate-300/90 open:shadow-md open:shadow-slate-900/[0.06]"
            onToggle={(e) => {
              const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
              setOpen(nextOpen ? idx : null);
            }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left outline-offset-2 transition hover:bg-slate-50/90 group-open:rounded-b-none group-open:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
              <span className="text-sm font-semibold text-slate-900">{it.q}</span>
              <span className="text-slate-500 group-open:hidden">+</span>
              <span className="hidden text-slate-500 group-open:inline">–</span>
            </summary>

            {isOpen ? (
              <div
                className={
                  reduced
                    ? "overflow-hidden"
                    : "overflow-hidden motion-safe:animate-[accordion-open_0.28s_cubic-bezier(0.2,0.8,0.2,1)_both]"
                }
              >
                <div className="border-t border-slate-100/80 bg-slate-50/35 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-700">
                  {it.a}
                </div>
              </div>
            ) : null}
          </details>
        );
      })}
    </div>
  );
}
