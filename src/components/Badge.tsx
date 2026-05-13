import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-200/40 bg-gradient-to-br from-white/95 to-slate-50/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/[0.04] ring-1 ring-white/70">
      {children}
    </span>
  );
}
