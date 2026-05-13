"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

type Item = {
  src: string;
  alt: string;
  className: string;
  speed: number;
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function HeroCollage({
  items
}: {
  items: Item[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y0 = useTransform(scrollYProgress, [0, 1], [0, -18 * items[0]?.speed]);
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -18 * items[1]?.speed]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -18 * items[2]?.speed]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -18 * items[3]?.speed]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -18 * items[4]?.speed]);
  const ys = [y0, y1, y2, y3, y4];

  return (
    <div ref={ref} className="relative">
      <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-indigo-500/14 via-white/35 to-teal-500/11 blur-2xl" />
      <div className="relative grid gap-4 rounded-[28px] border border-slate-200/85 bg-white/65 p-4 shadow-[0_8px_40px_-20px_rgba(15,23,42,0.12)] ring-1 ring-white/50 backdrop-blur-md">
        <div className="grid grid-cols-12 gap-4">
          {items.map((it, idx) => {
            const y = ys[idx];
            return (
              <motion.div
                key={it.src}
                style={reduced ? undefined : { y }}
                whileHover={reduced ? undefined : { y: -4, rotate: 0.2 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04]",
                  it.className
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

