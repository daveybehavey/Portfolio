import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Container } from "@/components/Container";
import { SITE_TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200/80 bg-white/90 py-10">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <BrandLogo showTagline={false} size="footer" />
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              {SITE_TAGLINE}
            </p>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} EuroDigital. All rights reserved.
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <Link
                href="/website-design-vancouver-island"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Island websites
              </Link>
              <Link
                href="/projects"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Portfolio
              </Link>
              <Link
                href="/projects/maestrosservices"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                MaestrosServices
              </Link>
              <Link
                href="/projects/starmapco"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                StarMapCo
              </Link>
              <Link
                href="/#packages"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Packages
              </Link>
              <Link
                href="/#why-us"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Why us
              </Link>
              <Link
                href="/#contact"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Privacy
              </Link>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                ·
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Built with Next.js · Tailwind · Motion
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
