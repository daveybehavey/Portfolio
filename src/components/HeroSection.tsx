"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Skip cursor-driven glow updates while the document is scrolling — avoids jank from state + large gradients. */
const SCROLL_IDLE_MS = 140;

export function HeroSection({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [glow, setGlow] = useState({ x: 22, y: 18 });
  const scrollPauseRef = useRef(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const markScrolling = () => {
      scrollPauseRef.current = true;
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = setTimeout(() => {
        scrollPauseRef.current = false;
        scrollIdleTimerRef.current = null;
      }, SCROLL_IDLE_MS);
    };

    // Scroll only (not wheel): wheel would also fire for Ctrl+pinch zoom and pause the glow unnecessarily.
    window.addEventListener("scroll", markScrolling, { passive: true });
    return () => {
      window.removeEventListener("scroll", markScrolling);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    };
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced) return;
    if (scrollPauseRef.current) return;
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
    const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
    setGlow({ x, y });
  };

  const onMouseLeave = () => {
    if (reduced) return;
    setGlow({ x: 22, y: 18 });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative overflow-hidden py-18 sm:py-24 lg:py-28"
    >
      {!reduced ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-90 transition-[opacity] duration-300"
          style={{
            background: `radial-gradient(580px circle at ${glow.x}% ${glow.y}%, rgba(79, 70, 229, 0.14), transparent 58%),
              radial-gradient(420px circle at ${100 - glow.x * 0.85}% ${100 - glow.y * 0.7}%, rgba(13, 148, 136, 0.1), transparent 52%)`
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-indigo-500/[0.07] via-transparent to-teal-500/[0.06]"
        />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
