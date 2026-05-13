"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { ButtonLink } from "@/components/Button";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const links = [
  { href: "#featured", label: "NoteBill" },
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "/projects", label: "Portfolio" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" }
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>("a[href], button");
      requestAnimationFrame(() => first?.focus());
    } else if (prevOpenRef.current) {
      menuButtonRef.current?.focus();
    }
    prevOpenRef.current = open;
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        ref={menuButtonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/5 backdrop-blur transition hover:bg-white active:scale-[0.97] motion-reduce:active:scale-100"
      >
        <span className="sr-only">{open ? "Close" : "Menu"}</span>
        <span aria-hidden className="font-mono text-base leading-none">
          {open ? "×" : "≡"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default bg-slate-950/25 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.15 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className="fixed left-3 right-3 top-20 z-50 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur-md"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="p-4">
                <div className="grid gap-1">
                  {links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
                <div className="mt-4">
                  <ButtonLink href="#contact" className="w-full" magnetic>
                    Contact
                  </ButtonLink>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
