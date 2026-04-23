import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type PillTone = "default" | "muted" | "accent" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<PillTone, string> = {
  default: "border-slate-200 bg-white text-slate-700",
  muted: "border-slate-200 bg-slate-100 text-slate-600",
  accent: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

type PillProps = {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
};

export default function Pill({ children, tone = "default", className }: PillProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
