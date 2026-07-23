"use client";

import Image from "next/image";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

type Item = {
  src: string;
  alt: string;
  className: string;
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function HeroCollage({ items }: { items: Item[] }) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-slate-200/35 via-white/40 to-slate-100/25" />
      <div className="relative grid gap-4 rounded-[28px] border border-slate-200/85 bg-white/80 p-4 shadow-[0_8px_40px_-20px_rgba(15,23,42,0.12)] ring-1 ring-white/50">
        <div className="grid grid-cols-12 gap-4">
          {items.map((it, idx) => (
            <div
              key={`${it.src}-${idx}`}
              className={cn(
                "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04] transition-transform duration-300 ease-out motion-reduce:transition-none",
                !reduced && "hover:-translate-y-0.5",
                it.className,
              )}
            >
              <Image
                src={it.src}
                alt={it.alt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 520px, 90vw"
                priority={idx === 0}
                fetchPriority={idx === 0 ? "high" : "low"}
                decoding={idx === 0 ? "sync" : "async"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
