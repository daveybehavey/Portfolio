import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <PageBackground />
      <SkipLink />
      <SiteHeader />

      <main
        id="main-content"
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          404
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          That page is not here.
        </h1>
        <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-slate-600">
          The link may be outdated, or the URL was mistyped. Head back to the
          homepage or open the portfolio.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/projects" variant="secondary">
            Portfolio
          </ButtonLink>
          <Link
            href="/#contact"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            Contact
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
