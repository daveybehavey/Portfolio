"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/Button";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const badges = ["Vancouver Island", "Shipped apps & client sites", "Scoped builds, clean handoffs"] as const;

const titleLines = [
  "Websites and apps that feel sharp,",
  "built for island businesses and solo operators,",
  "and tuned to turn interest into real inquiries."
] as const;

const subtext =
  "I'm EuroDigital — calm structure, fast pages, and copy that reads like a human wrote it. Whether you need a lead site or a small app, you get a fixed scope, a clear launch, and the keys when we're done.";

const footerLine = "Based on Vancouver Island, BC — local SEO basics baked in, and handoffs you can run without me.";

export function HeroIntro() {
  const reduced = usePrefersReducedMotion();
  const outerStagger = reduced ? 0 : 0.09;
  const lineStagger = reduced ? 0 : 0.055;
  const duration = reduced ? 0 : 0.5;
  const ease = [0.2, 0.8, 0.2, 1] as const;

  const itemHidden = reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 };
  const itemShow = { opacity: 1, y: 0, transition: { duration, ease } };

  const outer = {
    hidden: {},
    show: {
      transition: { staggerChildren: outerStagger, delayChildren: reduced ? 0 : 0.04 }
    }
  };

  const lineContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: lineStagger, delayChildren: 0 }
    }
  };

  const item = {
    hidden: itemHidden,
    show: itemShow
  };

  return (
    <div className="lg:col-span-7">
      <motion.div initial="hidden" animate="show" variants={outer}>
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <Badge key={b}>{b}</Badge>
          ))}
        </motion.div>

        <motion.h1
          variants={lineContainer}
          className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.05]"
        >
          {titleLines.map((line, i) => (
            <motion.span key={i} variants={item} className="block">
              {line}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-slate-700 sm:text-xl"
        >
          {subtext}
        </motion.p>

        <motion.div variants={item} className="mt-7 flex flex-wrap items-center gap-3">
          <ButtonLink href="#featured" magnetic>
            Explore NoteBill
          </ButtonLink>
          <ButtonLink href="#contact" variant="secondary">
            Start a conversation
          </ButtonLink>
          <ButtonLink href="/projects" variant="secondary">
            Full portfolio
          </ButtonLink>
        </motion.div>

        <motion.p variants={item} className="mt-4 text-sm leading-relaxed text-slate-600">
          {footerLine}
        </motion.p>
      </motion.div>
    </div>
  );
}
