import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export type MetadataItem = {
  label: string;
  value: ReactNode;
};

type MetadataGridProps = {
  items: MetadataItem[];
  columns?: 1 | 2 | 3;
  className?: string;
};

const columnClasses: Record<NonNullable<MetadataGridProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
};

export default function MetadataGrid({
  items,
  columns = 2,
  className,
}: MetadataGridProps): JSX.Element {
  return (
    <dl className={cn("grid gap-3", columnClasses[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</dt>
          <dd className="mt-2 text-sm leading-6 text-slate-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
