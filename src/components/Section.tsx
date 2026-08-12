import { Container } from "@/components/Container";

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  className,
  titleAs = "h2",
  divider = true,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Use `h1` once per page for the primary section title (SEO / a11y). */
  titleAs?: "h1" | "h2";
  /** Subtle gradient line at the top of the section. */
  divider?: boolean;
  children: React.ReactNode;
}) {
  const TitleTag = titleAs;

  return (
    <section
      id={id}
      className={[
        "relative py-16 sm:py-24 lg:py-28",
        id ? "scroll-mt-28" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {divider ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-indigo-200/45 to-transparent"
        />
      ) : null}
      <Container>
        {(eyebrow || title || subtitle) && (
          <div className="mb-10 max-w-2xl sm:mb-12 lg:mb-14">
            {eyebrow && (
              <div className="flex items-center gap-2.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/40"
                  aria-hidden
                />
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  {eyebrow}
                </div>
              </div>
            )}
            {title && (
              <TitleTag className="mt-3 text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:mt-3.5 sm:text-3xl sm:leading-snug">
                {title}
              </TitleTag>
            )}
            {subtitle && (
              <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed text-slate-600 sm:text-[1.05rem] sm:leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
