import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import Pill from "./Pill";

type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  eyebrow = "Workspace",
  meta,
  actions,
  stats,
  className,
}: PageHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92),rgba(239,246,255,0.92))] px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 sm:py-8",
        className
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <Pill tone="accent">{eyebrow}</Pill>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{description}</p>
          {meta ? <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">{meta}</div> : null}
        </div>

        {actions ? <div className="flex w-full shrink-0 flex-wrap items-center gap-3 lg:w-auto lg:justify-end">{actions}</div> : null}
      </div>

      {stats ? <div className="mt-6 grid gap-3 md:grid-cols-3">{stats}</div> : null}
    </header>
  );
}
