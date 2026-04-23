import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type SectionCardTone = "default" | "subtle" | "accent";

const toneClasses: Record<SectionCardTone, string> = {
  default: "bg-white/95",
  subtle: "bg-slate-50/95",
  accent: "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96))]",
};

type SectionCardProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: SectionCardTone;
};

export default function SectionCard({
  title,
  description,
  eyebrow,
  action,
  children,
  className,
  contentClassName,
  tone = "default",
}: SectionCardProps): JSX.Element {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur",
        toneClasses[tone],
        className
      )}
    >
      {title || description || action || eyebrow ? (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-5 sm:px-6">
          <div className="space-y-1">
            {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p> : null}
            {title ? <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2> : null}
            {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-5 py-5 sm:px-6", contentClassName)}>{children}</div>
    </section>
  );
}
