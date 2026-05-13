"use client";

import { motion, type MotionProps, useInView } from "framer-motion";
import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
  once = true
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, {
    amount: 0.15,
    once,
    margin: "0px 0px -10% 0px"
  });
  const reduced = usePrefersReducedMotion();

  const initial: MotionProps["initial"] = reduced ? { opacity: 1 } : { opacity: 0, y };
  const animate: MotionProps["animate"] = reduced
    ? { opacity: 1 }
    : inView
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

