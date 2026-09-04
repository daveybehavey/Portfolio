"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/Button";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const badges = [
  "Victoria & Vancouver Island",
  "Websites + growth systems",
  "Repairs from $125",
  "Clear scope · measurable setup",
] as const;

const titleLines = [
  "Build a stronger website.",
  "Get found more clearly.",
  "Measure what improves.",
] as const;

const subtext =
  "EuroDigital builds fast, mobile-friendly websites and practical growth foundations for local businesses — with clear offers, search-friendly structure, analytics, and accounts you control.";

const footerLine =
  "Small live-site repairs from $125 CAD when that’s enough. Larger projects can include search, analytics, conversion, and ongoing improvement support without requiring a long-term retainer.";

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
      transition: {
        staggerChildren: outerStagger,
        delayChildren: reduced ? 0 : 0.04,
      },
    },
  };

  const lineContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: lineStagger, delayChildren: 0 },
    },
  };

  const item = {
    hidden: itemHidden,
    show: itemShow,
  };

  return (
    <div className="lg:col-span-7">
      <motion.div initial={false} animate="show" variants={outer}>
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge}>{badge}</Badge>
          ))}
        </motion.div>

        <motion.h1
          variants={lineContainer}
          className="mt-4 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:mt-5 sm:text-6xl sm:leading-[1.05]"
        >
          {titleLines.map((line) => (
            <motion.span key={line} variants={item} className="block">
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

        <motion.div
          variants={item}
          className="mt-6 flex flex-wrap items-center gap-3"
        >
          <ButtonLink
            href="#contact"
            magnetic
            analyticsLocation="hero"
            analyticsLabel="Request a project estimate"
          >
            Request a project estimate
          </ButtonLink>
          <ButtonLink
            href="/website-design-vancouver-island"
            variant="secondary"
            analyticsLocation="hero"
            analyticsLabel="Island website design"
          >
            Island website design
          </ButtonLink>
          <ButtonLink
            href="#examples"
            variant="secondary"
            analyticsLocation="hero"
            analyticsLabel="See live work"
          >
            See live work
          </ButtonLink>
        </motion.div>

        <motion.p
          variants={item}
          className="mt-4 text-sm leading-relaxed text-slate-600"
        >
          {footerLine}
        </motion.p>
      </motion.div>
    </div>
  );
}
