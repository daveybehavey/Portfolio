import { BrandLogo } from "@/components/BrandLogo";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { MobileNav } from "@/components/MobileNav";
import { NavLink } from "@/components/NavLink";

type SiteHeaderProps = {
  /** Full section nav (homepage-style). Off on minimal pages if needed. */
  showSectionNav?: boolean;
};

export function SiteHeader({ showSectionNav = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.02]">
      <Container>
        <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-3">
          <BrandLogo className="min-w-0 shrink" showTagline={false} />

          {showSectionNav ? (
            <nav
              className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 text-sm lg:flex"
              aria-label="Primary"
            >
              <NavLink href="/#examples" className="nav-link">
                Examples
              </NavLink>
              <NavLink href="/#packages" className="nav-link">
                Packages
              </NavLink>
              <NavLink href="/#why-us" className="nav-link">
                Why us
              </NavLink>
              <NavLink href="/#work" className="nav-link">
                Work
              </NavLink>
              <NavLink href="/#process" className="nav-link">
                Process
              </NavLink>
              <NavLink href="/projects" className="nav-link">
                Portfolio
              </NavLink>
              <NavLink href="/#contact" className="nav-link">
                Contact
              </NavLink>
            </nav>
          ) : (
            <div className="hidden flex-1 lg:block" aria-hidden />
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ButtonLink
              href="/#contact"
              className="inline-flex shrink-0 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
              magnetic
              analyticsLocation="header"
              analyticsLabel="Get a quote"
            >
              <span className="sm:hidden">Quote</span>
              <span className="hidden sm:inline">Get a quote</span>
            </ButtonLink>
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
