import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
};

export default function FormField({ label, hint, htmlFor, children }: FormFieldProps): JSX.Element {
  return (
    <label className="flex flex-col gap-2 text-sm" htmlFor={htmlFor}>
      <span className="font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}
