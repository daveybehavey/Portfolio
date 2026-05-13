import Link from "next/link";
import { SITE_TAGLINE } from "@/lib/site";

type BrandLogoProps = {
  /** Shorter header on very small screens when false */
  showTagline?: boolean;
  className?: string;
};

export function BrandLogo({ showTagline = true, className = "" }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={`group rounded-md outline-offset-4 transition-opacity duration-200 hover:opacity-90 ${className}`}
    >
      <span className="block text-base font-semibold tracking-tight text-slate-900 sm:text-[1.05rem]">
        Euro<span className="text-indigo-600">Digital</span>
      </span>
      {showTagline ? (
        <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">
          {SITE_TAGLINE}
        </span>
      ) : null}
    </Link>
  );
}
