import type { AdvisorSupportingItem } from "../types/advisor";

type AdvisorSupportingItemsProps = {
  items: AdvisorSupportingItem[];
};

function formatFieldName(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFieldValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value !== null && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function AdvisorSupportingItems({ items }: AdvisorSupportingItemsProps): JSX.Element | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {items.map((item, index) => (
        <article key={`${item.item_type}-${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
              {item.item_type}
            </span>
          </div>

          {Object.keys(item.details).length > 0 ? (
            <dl className="mt-2 grid gap-1 text-xs text-slate-700">
              {Object.entries(item.details).map(([key, value]) => (
                <div key={`${item.title}-${key}`} className="grid grid-cols-[130px_1fr] gap-2">
                  <dt className="font-medium text-slate-500">{formatFieldName(key)}</dt>
                  <dd className="text-slate-700">{formatFieldValue(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </article>
      ))}
    </div>
  );
}
