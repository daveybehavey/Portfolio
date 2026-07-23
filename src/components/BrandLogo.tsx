import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_MARK, SITE_TAGLINE } from "@/lib/site";

type BrandLogoProps = {
  showTagline?: boolean;
  className?: string;
  size?: "header" | "footer";
};

export function BrandLogo({
  showTagline = true,
  className = "",
  size = "header",
}: BrandLogoProps) {
  const markSize = size === "footer" ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10";
  const wordClass =
    size === "footer"
      ? "text-sm font-semibold tracking-tight text-slate-900"
      : "text-base font-semibold tracking-tight text-slate-900 sm:text-[1.05rem]";

  return (
    <Link
      href="/"
      className={`group inline-flex min-w-0 shrink-0 items-center gap-2 rounded-md outline-offset-4 transition-opacity duration-200 hover:opacity-90 sm:gap-2.5 lg:gap-3 ${className}`}
    >
      <Image
        src={BRAND_LOGO_MARK}
        alt=""
        width={80}
        height={80}
        className={`${markSize} shrink-0 object-contain`}
        priority={size === "header"}
        aria-hidden
      />
      <span className="flex min-w-0 flex-col">
        <span className={wordClass}>
          Euro<span className="text-indigo-600">Digital</span>
        </span>
        {showTagline ? (
          <span className="mt-0.5 hidden max-w-[11rem] truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 xl:block xl:max-w-[14rem] xl:whitespace-nowrap xl:tracking-[0.14em]">
            {SITE_TAGLINE}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
