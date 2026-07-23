"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/Button";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const badges = [
  "Vancouver Island",
  "Websites & online stores",
  "Website + Google setup + handoff",
] as const;

const titleLines = [
  "We build your website,",
  "set up the essentials,",
  "and hand you the keys.",
] as const;

const subtext =
  "EuroDigital builds clean, practical websites and working online stores for service businesses, creators, and small shops — from lead-generation sites to full ecommerce with cart, checkout, and payments, plus Google setup, email forwarding, analytics, basic SEO, and handoff.";

const footerLine =
  "Not a big agency or monthly marketing shop — scoped website launches for trades, local services, makers, and small brands on Vancouver Island.";

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
          {badges.map((b) => (
            <Badge key={b}>{b}</Badge>
          ))}
        </motion.div>

        <motion.h1
          variants={lineContainer}
          className="mt-4 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:mt-5 sm:text-6xl sm:leading-[1.05]"
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

        <motion.div
          variants={item}
          className="mt-6 flex flex-wrap items-center gap-3"
        >
          <ButtonLink
            href="#packages"
            magnetic
            analyticsLocation="hero"
            analyticsLabel="View packages"
          >
            View packages
          </ButtonLink>
          <ButtonLink
            href="#examples"
            variant="secondary"
            analyticsLocation="hero"
            analyticsLabel="See example types"
          >
            See example types
          </ButtonLink>
          <ButtonLink
            href="#contact"
            variant="secondary"
            analyticsLocation="hero"
            analyticsLabel="Get a quote"
          >
            Get a quote
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
