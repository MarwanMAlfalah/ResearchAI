import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type ActionBarProps = {
  children: ReactNode;
  className?: string;
};

export default function ActionBar({ children, className }: ActionBarProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[28px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-6",
        className
      )}
    >
      {children}
    </div>
  );
}
