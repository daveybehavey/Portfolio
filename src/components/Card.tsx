export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-200/80 bg-white/82 backdrop-blur-md",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.65)_inset,0_2px_12px_-4px_rgba(15,23,42,0.06)]",
        "transition-[box-shadow,border-color,transform] duration-300 ease-out motion-reduce:transition-none",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

