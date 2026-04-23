import { MetadataGrid, Pill } from "../../../components/ui";
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
    <div className="mt-4 grid gap-3">
      {items.map((item, index) => (
        <article key={`${item.item_type}-${item.title}-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">{item.title}</p>
            <Pill tone="accent" className="normal-case tracking-[0.04em]">
              {item.item_type}
            </Pill>
          </div>

          {Object.keys(item.details).length > 0 ? (
            <MetadataGrid
              className="mt-4"
              items={Object.entries(item.details).map(([key, value]) => ({
                label: formatFieldName(key),
                value: formatFieldValue(value),
              }))}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}
