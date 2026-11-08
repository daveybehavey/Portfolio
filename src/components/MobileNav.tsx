"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ButtonLink } from "@/components/Button";
import { buildContactHref, noteInquiryCta } from "@/lib/lead-attribution";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const links = [
  { href: "/#examples", label: "Examples" },
  { href: "/#packages", label: "Packages" },
  { href: "/#why-us", label: "Why us" },
  { href: "/#work", label: "Work" },
  { href: "/#process", label: "Process" },
  {
    href: "/website-design-vancouver-island",
    label: "Island websites",
  },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Portfolio" },
  { href: "/#faq", label: "FAQ" },
  {
    href: buildContactHref({
      ctaLabel: "Contact",
      ctaLocation: "mobile_nav",
    }),
    label: "Contact",
  },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
    }
    setVisible(false);
    if (!mounted) return;
    if (reduced) {
      setMounted(false);
      return;
    }
    const t = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(t);
  }, [open, mounted, reduced]);

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
    if (!open) return;
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>("a[href]");
      first?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) {
      prevOpenRef.current = true;
      return;
    }
    if (prevOpenRef.current) {
      menuButtonRef.current?.focus();
      prevOpenRef.current = false;
    }
  }, [open]);

  const panelTransition = reduced
    ? undefined
    : "transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]";
  const backdropTransition = reduced
    ? undefined
    : "transition-opacity duration-150 ease-out";

  return (
    <div className="lg:hidden">
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

      {mounted ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className={[
              "fixed inset-0 z-40 cursor-default bg-slate-950/25 backdrop-blur-[2px]",
              backdropTransition,
              visible ? "opacity-100" : "opacity-0",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className={[
              "fixed left-3 right-3 top-20 z-50 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur-md",
              panelTransition,
              visible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-[-8px] scale-[0.98] opacity-0",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="p-4">
              <div className="grid gap-1">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    onClick={() => {
                      if (l.label === "Contact") {
                        noteInquiryCta({
                          label: "Contact",
                          location: "mobile_nav",
                        });
                      }
                      setOpen(false);
                    }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="mt-4">
                <ButtonLink
                  href="/#contact"
                  className="w-full"
                  magnetic
                  analyticsLocation="mobile_nav"
                  analyticsLabel="Get a quote"
                >
                  Get a quote
                </ButtonLink>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
