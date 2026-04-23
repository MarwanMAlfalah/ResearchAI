import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "success";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-slate-900 bg-slate-950 text-white shadow-sm hover:border-slate-800 hover:bg-slate-800 focus-visible:ring-slate-300",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-slate-200",
  ghost:
    "border border-transparent bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900 focus-visible:ring-slate-200",
  success:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100 focus-visible:ring-emerald-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-xl px-3 py-2 text-xs font-semibold",
  md: "min-h-11 rounded-2xl px-4 py-2.5 text-sm font-semibold",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition duration-150 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
