"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { type AnalyticsLocation, trackCtaAndMaybeLead } from "@/lib/analytics";
import {
  isContactHref,
  noteInquiryCta,
  withContactAttribution,
} from "@/lib/lead-attribution";

type CommonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  magnetic?: boolean;
  /** GA4: where the click happened (header, hero, packages, …). */
  analyticsLocation?: AnalyticsLocation;
  /** GA4: button label override (defaults to children text). */
  analyticsLabel?: string;
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function useMagnetic(magnetic: boolean | undefined) {
  const ref = useRef<HTMLElement | null>(null);

  const handlers = useMemo(() => {
    if (!magnetic) return {};
    return {
      onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.min(18, Math.sqrt(dx * dx + dy * dy) / 10);
        el.style.transform = `translate3d(${(dx / rect.width) * dist}px, ${(dy / rect.height) * dist}px, 0)`;
      },
      onMouseLeave: () => {
        const el = ref.current;
        if (!el) return;
        el.style.transform = "translate3d(0,0,0)";
      },
    } as const;
  }, [magnetic]);

  return { ref, handlers };
}

function resolveLabel(
  children: React.ReactNode,
  analyticsLabel: string | undefined,
  href: string,
): string {
  return analyticsLabel ?? (typeof children === "string" ? children : href);
}

function useAnalyticsClick(
  href: string,
  children: React.ReactNode,
  analyticsLocation?: AnalyticsLocation,
  analyticsLabel?: string,
) {
  return () => {
    if (!analyticsLocation) return;
    const label = resolveLabel(children, analyticsLabel, href);
    if (isContactHref(href)) {
      noteInquiryCta({ label, location: analyticsLocation });
    }
    trackCtaAndMaybeLead({ label, location: analyticsLocation, href });
  };
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  magnetic,
  analyticsLocation,
  analyticsLabel,
}: CommonProps & { href: string }) {
  const { ref, handlers } = useMagnetic(magnetic);
  const label = resolveLabel(children, analyticsLabel, href);
  const resolvedHref = withContactAttribution(href, {
    ctaLabel: analyticsLocation ? label : undefined,
    ctaLocation: analyticsLocation,
  });
  const onAnalytics = useAnalyticsClick(
    resolvedHref,
    children,
    analyticsLocation,
    analyticsLabel,
  );
  const classes =
    variant === "primary"
      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500"
      : "border border-slate-200 bg-white/70 text-slate-900 hover:bg-white";

  return (
    <Link
      href={resolvedHref}
      ref={(node) => {
        // next/link ref typing differs; keep it simple
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ref as any).current = node;
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold touch-manipulation transition duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
        classes,
        className,
      )}
      {...handlers}
      onClick={() => onAnalytics()}
    >
      {children}
    </Link>
  );
}

export function ButtonA({
  href,
  children,
  variant = "primary",
  className,
  magnetic,
  target,
  rel,
  analyticsLocation,
  analyticsLabel,
}: CommonProps & { href: string; target?: string; rel?: string }) {
  const { ref, handlers } = useMagnetic(magnetic);
  const label = resolveLabel(children, analyticsLabel, href);
  const resolvedHref = withContactAttribution(href, {
    ctaLabel: analyticsLocation ? label : undefined,
    ctaLocation: analyticsLocation,
  });
  const onAnalytics = useAnalyticsClick(
    resolvedHref,
    children,
    analyticsLocation,
    analyticsLabel,
  );
  const classes =
    variant === "primary"
      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500"
      : "border border-slate-200 bg-white/70 text-slate-900 hover:bg-white";

  const safeRel = target === "_blank" ? (rel ?? "noopener noreferrer") : rel;

  return (
    <a
      href={resolvedHref}
      target={target}
      rel={safeRel}
      ref={(node) => {
        ref.current = node as unknown as HTMLElement;
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold touch-manipulation transition duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
        classes,
        className,
      )}
      {...handlers}
      onClick={() => onAnalytics()}
    >
      {children}
    </a>
  );
}
