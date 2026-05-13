import Link from "next/link";
import { Container } from "@/components/Container";
import { SITE_TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/50 py-10 backdrop-blur-sm">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              Euro<span className="text-indigo-600">Digital</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">{SITE_TAGLINE}</p>
            <div className="text-sm text-slate-500">© {new Date().getFullYear()} EuroDigital. All rights reserved.</div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <Link
                href="/projects"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Portfolio
              </Link>
              <Link
                href="/#contact"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Contact
              </Link>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                ·
              </span>
            </div>
            <span className="text-xs text-slate-500">Built with Next.js · Tailwind · Motion</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
