export function HeroSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16">
      {children}
    </section>
  );
}
