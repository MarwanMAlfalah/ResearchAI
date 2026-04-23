import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type StatusTone = "loading" | "error" | "success" | "empty" | "info";

const toneClasses: Record<StatusTone, string> = {
  loading: "border-slate-200 bg-white text-slate-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  empty: "border-slate-200 bg-white text-slate-600",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

type StatusPanelProps = {
  tone: StatusTone;
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function StatusPanel({ tone, title, children, className }: StatusPanelProps): JSX.Element {
  return (
    <section className={cn("rounded-[24px] border px-5 py-5 shadow-sm", toneClasses[tone], className)}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      <div className={cn("text-sm leading-6", title ? "mt-2" : "")}>{children}</div>
    </section>
  );
}
