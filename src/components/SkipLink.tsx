export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition focus:translate-y-0 focus:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      Skip to content
    </a>
  );
}
