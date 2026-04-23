import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type StatTone = "default" | "accent" | "success" | "warning";

const toneClasses: Record<StatTone, string> = {
  default: "bg-white/90 text-slate-900",
  accent: "bg-sky-50 text-slate-900",
  success: "bg-emerald-50 text-slate-900",
  warning: "bg-amber-50 text-slate-900",
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
  className?: string;
};

export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: StatCardProps): JSX.Element {
  return (
    <article className={cn("rounded-[24px] border border-white/80 px-4 py-4 shadow-sm", toneClasses[tone], className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
      {hint ? <div className="mt-2 text-sm leading-6 text-slate-600">{hint}</div> : null}
    </article>
  );
}
