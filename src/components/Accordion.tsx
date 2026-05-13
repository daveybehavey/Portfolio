"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export function Accordion({
  items
}: {
  items: Array<{ q: string; a: string }>;
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
            className="group rounded-2xl border border-slate-200/85 bg-white/82 shadow-sm shadow-slate-900/[0.05] backdrop-blur-md transition-colors open:border-slate-300/90 open:shadow-md open:shadow-slate-900/[0.06]"
            onToggle={(e) => {
              const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
              setOpen(nextOpen ? idx : null);
            }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left outline-offset-2 transition hover:bg-slate-50/90 group-open:rounded-b-none group-open:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
              <span className="text-sm font-semibold text-slate-900">{it.q}</span>
              <span className="text-slate-500 group-open:hidden">+</span>
              <span className="text-slate-500 hidden group-open:inline">–</span>
            </summary>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { height: "auto", opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-100/80 bg-slate-50/35 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-700">
                    {it.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </details>
        );
      })}
    </div>
  );
}

